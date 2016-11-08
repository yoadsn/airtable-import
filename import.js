import mongoose, { Schema } from 'mongoose'
import Airtable from 'airtable'
import slug from 'slug';
import addressParser from 'parse-address';
import GoogleMaps from '@google/maps';
import { ATIDMapping, Space, Maker, Item, Pop, View, Image } from './mongoschema.js'

let googleMapsClient = GoogleMaps.createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: global.Promise
});

slug.defaults.mode = 'rfc3986';

const getAirTableBase = () => {
  let base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_NAME);
  return base;
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

const getImageDataFromImageRemoteId = async (remoteId) => {
  console.dir(remoteId);
  if (!remoteId || remoteId.length == 0) return null;
  console.log('looking...');
  let localImageId = await getLocalIdForRemoteId(remoteId[0]);
  let image = await Image.findOne({ _id: localImageId});
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
      console.log(curr.get('ID'));
      let localId = await getLocalIdForRemoteId(remoteIdGenerator(curr.getId()))
      let extractedData = await extractRecordData(curr);
      console.log(extractedData.titleImage);
      await Model.findOneAndUpdate({ _id: localId}, extractedData, { upsert: true })
    }

    return acc.then(storeOne);
  }, Promise.resolve())
  .catch(err => console.error(err));
}

const viewRemoteIdGeneratorFromPop = (id) => 'view.' + id;

const generateBasedAtFromGooglePlaceResult = (result) => {
  let streetNoComp = result.address_components.find(comp => comp.types.includes('street_number')).long_name;
  let routeComp = result.address_components.find(comp => comp.types.includes('route')).short_name;
  let cityComp = result.address_components.find(comp => comp.types.includes('locality')).long_name;
  let stateComp = result.address_components.find(comp => comp.types.includes('administrative_area_level_1')).short_name;
  let zipComp = result.address_components.find(comp => comp.types.includes('postal_code')).long_name;
  let countryComp = result.address_components.find(comp => comp.types.includes('country')).long_name;

  let street = [streetNoComp, routeComp].join(' ');

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
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.results[0]));

const generateBasedAtFromPlaceID = async (placeId) =>
  googleMapsClient.place({ placeid: placeId}).asPromise()
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.result));

const extractSpaceData = async (importedRecord) => ({
  name: importedRecord.get('Name'),
  googleSpaceId: importedRecord.get('Google Space ID'),
  slug: slug(importedRecord.get('Name')),
  descriptionHtml: importedRecord.get('Description'),
  logoImage: await getImageDataFromImageRemoteId(importedRecord.get('Logo Image')),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Title Image')),
  externalUrl: importedRecord.get('Site URL'),
  type: importedRecord.get('Space Type'),
  spaceBasedAt: await generateBasedAtFromPlaceID(importedRecord.get('Google Space ID')),
});

const extractMakerData = async (importedRecord) => ({
  name: importedRecord.get('Name'),
  slug: slug(importedRecord.get('Name')),
  descriptionHtml: importedRecord.get('Description'),
  logoImage: await getImageDataFromImageRemoteId(importedRecord.get('Logo Image')),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Title Image')),
  externalUrl: importedRecord.get('Site URL'),
  type: importedRecord.get('Maker Type'),
  makerBasedAt: await generateBasedAtFromAddress(importedRecord.get('Location'))
});

const extractItemData = async (importedRecord) => ({
  name: importedRecord.get('Name'),
  maker: await getLocalIdForRemoteId(importedRecord.get('Maker')),
  descriptionHtml: importedRecord.get('Description'),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Item Image')),
  externalUrl: importedRecord.get('Shoppable Link'),
});

const extractViewData = async (importedRecord) => ({
  space: await getLocalIdForRemoteId(importedRecord.get('Space')),
  titleImage: await getImageDataFromImageRemoteId(importedRecord.get('Longhost POP Image'))
});

const extractPopData = async (importedRecord) => ({
  view: await getLocalIdForRemoteId(viewRemoteIdGeneratorFromPop(importedRecord.getId())),
  item: await getLocalIdForRemoteId(importedRecord.get('Item')),
  descriptionHtml: importedRecord.get('Description'),
  closeupImage: await getImageDataFromImageRemoteId(importedRecord.get('Closeup POP Image'))
});

const extractImageData = async (importedRecord) => ({
  publicId: importedRecord.get('Public ID'),
  creditsTo: importedRecord.get('Credits To'),
  creditsLink: importedRecord.get('Credits Link')
});

const importEnabled = {
  'images' : 0,
  'spaces' : 0,
  'makers': 0,
  'items': 0,
  'pops': 1
}

export const runImport = async () => {

  let base = getAirTableBase();

  if (importEnabled['images']) {
    let images = await loadFromAirTable(base, 'images', { fields : ['Public ID', 'Credits To', 'Credits Link'] });
    images = images.filter(space => space.get('Public ID'));
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
