import mongoose, { Schema } from 'mongoose'
import cloudinary from 'cloudinary';
import Airtable from 'airtable'
import slug from 'slug';
import addressParser from 'parse-address';
import GoogleMaps from '@google/maps';

import getBaseChanges from './airtableHistory.js';
import { ATIDMapping, Space, Maker, Item, Pop, View, Image, ATImageUsage, CDImageInfoCache } from './mongoschema.js'

let googleMapsClient = GoogleMaps.createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: global.Promise
});

slug.defaults.mode = 'rfc3986';

const getAirTableBase = () => {
  let base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_NAME);
  return base;
}

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: 'wescover',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

const getImageInformation = async (publicId) => {
  let cachedInfo  = await CDImageInfoCache.findOne({ publicId });
  if (cachedInfo) {
      console.log('used cached image info');
      return cachedInfo.toObject().info;
  } else {
    let result = await new Promise((res, rej) => {
      console.log('Need to consult cloudinary api');
      cloudinary.api.resource(publicId, imageInfo => {
        if (imageInfo.error) {
          rej(imageInfo.error)
        } else {
          res({
            version: imageInfo.version,
            created_at: imageInfo.created_at,
            width: imageInfo.width,
            height: imageInfo.height,
            leadColor: imageInfo.colors[0][0]
          });
        }
      }, {
        colors: true
      });
    }).catch(err => {
      console.error(err);
      return null;
    });

    if (result) {
      console.log('storing image cache');
      await CDImageInfoCache.create({ publicId, info: result });
    }

    return result;
  }
}

const getLocalIdForRemoteId = async (remoteId) => {
  console.log(`Looking for remote id ${remoteId} in the DB.`);
  let idmap = await ATIDMapping.findOne({ remoteId });
  if (!idmap) {
    console.log(`could not find the remote id`);
    idmap = new ATIDMapping({ remoteId, localId: mongoose.Types.ObjectId() });
    await idmap.save();
  }

  return idmap.localId;
}

const getImageDataFromImageRemoteId = async (remoteId, usageLocalId, typeName) => {
  if (!remoteId || remoteId.length == 0) return null;
  let localImageId = await getLocalIdForRemoteId(remoteId[0]);
  let image = await Image.findOne({ _id: localImageId});
  if (image) {
    // Store this image usage if not mapped already
    let foundUsage = await ATImageUsage.find({ remoteId, localId: usageLocalId });
    if (foundUsage.length === 0) {
      let usage = new ATImageUsage({ remoteId, typeName, localId: usageLocalId})
      await usage.save();
    }
  }
  return image && image.toObject();
}

const loadFromAirTable = async (base, table, select = {}) => {
  let allRecords = [];
  return new Promise((res, rej) => {
    base(table).select(select)
    .eachPage((records, fetchNextPage) => {
      allRecords = allRecords.concat(records)
      fetchNextPage()
    }, (error) => {
      if (error) {
        rej(error)
      }
      res(allRecords);
    })
  });
}

const storeToDB = async (importedRecords, Model, extractRecordData, remoteIdGenerator = (id) => id) => {
  await importedRecords.reduce((acc, curr, idx) => {
    const storeOne = async () => {
      let localId = await getLocalIdForRemoteId(remoteIdGenerator(curr.getId()))
      let extractedData = await extractRecordData(curr, localId);
      await Model.findOneAndUpdate({ _id: localId}, extractedData, { upsert: true })
    }

    return acc.then(storeOne);
  }, Promise.resolve())
  .catch(err => console.error(err));
}

const viewRemoteIdGeneratorFromPop = (id) => 'view.' + id;

const getAddressComponentValue = (components, type, nameField) => {
  if (components) {
    let foundComponent = components.find(comp => comp.types.includes(type))
    if (foundComponent) {
      return foundComponent[nameField];
    }
  }

  return null;
}

const generateBasedAtFromGooglePlaceResult = (result) => {
  if (!result) return null;

  let streetNoComp = getAddressComponentValue(result.address_components, 'street_number', 'long_name');
  let routeComp = getAddressComponentValue(result.address_components, 'route', 'short_name');
  let cityComp = getAddressComponentValue(result.address_components, 'locality', 'long_name');
  let stateComp = getAddressComponentValue(result.address_components, 'administrative_area_level_1', 'short_name');
  let zipComp = getAddressComponentValue(result.address_components, 'postal_code', 'long_name');
  let countryComp = getAddressComponentValue(result.address_components, 'country', 'long_name');

  let street = [streetNoComp, routeComp].join(' ').trim();

  return {
    address : {
      street1: street,
      city: cityComp,
      state: stateComp,
      zip: zipComp,
      country: countryComp
    },
    location : {
      type: 'point',
      coordinates: [result.geometry.location.lng, result.geometry.location.lat]
    }
  }
}

const generateBasedAtFromAddress = async (address) =>
  googleMapsClient.geocode({ address }).asPromise()
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.results[0]))
    .then(result => {
      if (result) {
        result.rawAddress = address;
      }
      return result;
    });

const generateBasedAtFromPlaceID = async (placeId) =>
  googleMapsClient.place({ placeid: placeId}).asPromise()
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.result));

const extractSpaceData = async (importedRecord, localId) => ({
  name: importedRecord.get('Name'),
  googleSpaceId: importedRecord.get('Google Space ID'),
  slug: slug(importedRecord.get('Name')),
  descriptionHtml: importedRecord.get('Description'),
  logoImage: await getImageDataFromImageRemoteId(importedRecord.get('Logo Image'), localId, Space.modelName),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Title Image'), localId, Space.modelName),
  externalUrl: importedRecord.get('Site URL'),
  type: importedRecord.get('Space Type'),
  basedAt: await generateBasedAtFromPlaceID(importedRecord.get('Google Space ID')),
});

const extractMakerData = async (importedRecord, localId) => ({
  name: importedRecord.get('Name'),
  slug: slug(importedRecord.get('Name')),
  descriptionHtml: importedRecord.get('Description'),
  logoImage: await getImageDataFromImageRemoteId(importedRecord.get('Logo Image'), localId, Maker.modelName),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Title Image'), localId, Maker.modelName),
  externalUrl: importedRecord.get('Site URL'),
  type: importedRecord.get('Maker Type'),
  basedAt: await generateBasedAtFromAddress(importedRecord.get('Location'))
});

const extractItemData = async (importedRecord, localId) => ({
  name: importedRecord.get('Name'),
  maker: await getLocalIdForRemoteId(importedRecord.get('Maker')),
  descriptionHtml: importedRecord.get('Description'),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Item Image'), localId, Item.modelName),
  externalUrl: importedRecord.get('Shoppable Link'),
});

const extractViewData = async (importedRecord, localId) => ({
  space: await getLocalIdForRemoteId(importedRecord.get('Space')),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Longhost POP Image'), localId, View.modelName)
});

const extractPopData = async (importedRecord, localId) => ({
  view: await getLocalIdForRemoteId(viewRemoteIdGeneratorFromPop(importedRecord.getId())),
  item: await getLocalIdForRemoteId(importedRecord.get('Item')),
  descriptionHtml: importedRecord.get('Description'),
  closeupImage: await getImageDataFromImageRemoteId(importedRecord.get('Closeup POP Image'), localId, Pop.modelName)
});

const extractExtraImageInformation = async (publicId) => {
  let imageData = await getImageInformation(publicId);

  return imageData && {
    dimensions: {
        aspectRatio: imageData.width / imageData.height
    },
    metadata: {
      leadColor: imageData.leadColor
    }
  }
}

const extractImageData = async (importedRecord, localId) => ({
  publicId: importedRecord.get('Public ID'),
  creditsTo: importedRecord.get('Credits To'),
  creditsLink: importedRecord.get('Credits Link'),
  ...(await extractExtraImageInformation(importedRecord.get('Public ID')))
});

const importEnabled = {
  'images' : 0,
  'spaces' : 1,
  'makers': 1,
  'items': 1,
  'pops': 1
}

export const runImport = async () => {

  /*
  let z = await getBaseChanges();
  console.dir(z);
  return;
  */

  let base = getAirTableBase();

  configureCloudinary();

  if (importEnabled['images']) {
    let images = await loadFromAirTable(base, 'images', { fields : ['Public ID', 'Credits To', 'Credits Link'] });
    images = images.filter(image => image.get('Public ID'));
    console.log(`got ${images.length} images`);
    await storeToDB(images, Image, extractImageData);
    console.log(`image storing done.`);
  }

  if (importEnabled['spaces']) {
    let spaces = await loadFromAirTable(base, 'Spaces');
    spaces = spaces.filter(space => space.get('Name'));
    console.log(`got ${spaces.length} spaces`);
    await storeToDB(spaces, Space, extractSpaceData);
    console.log(`space storing done.`);
  }

  if (importEnabled['makers']) {
    let makers = await loadFromAirTable(base, 'Makers');
    makers = makers.filter(maker => maker.get('Name'));
    console.log(`got ${makers.length} makers`);
    await storeToDB(makers, Maker, extractMakerData);
    console.log(`maker storing done.`);
  }

  if (importEnabled['items']) {
    let items = await loadFromAirTable(base, 'Items');
    console.log(`got ${items.length} items`);
    await storeToDB(items, Item, extractItemData);
    console.log(`items storing done.`);
  }

  if (importEnabled['pops']) {
    let pops = await loadFromAirTable(base, 'Pops');
    pops = pops.filter(pop => pop.get('Space') && pop.get('Item'));
    console.log(`got ${pops.length} pops`);
    await storeToDB(pops, View, extractViewData, viewRemoteIdGeneratorFromPop);
    await storeToDB(pops, Pop, extractPopData);
    console.log(`pops+views storing done.`);
  }
}
