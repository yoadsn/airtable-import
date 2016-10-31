import mongoose, { Schema } from 'mongoose'
import Airtable from 'airtable'
import slug from 'slug';
import addressParser from 'parse-address';
import GoogleMaps from '@google/maps';
import { ATIDMapping, Space, Maker, Item, Pop, View } from './mongoschema.js'

let googleMapsClient = GoogleMaps.createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: global.Promise
});

slug.defaults.mode = 'rfc3986';

const getAirTableBase = () => {
  let base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY}).base(AIRTABLE_BASE_NAME);
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

const loadFromAirTable = async (base, table) => {
  let allRecords = [];
  return new Promise((res, rej) => {
    base(table).select({ })
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
      let extractedData = await extractRecordData(curr);
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

const extractSpaceData = async (importedSpaceRecord) => ({
  name: importedSpaceRecord.get('Name'),
  googleSpaceId: importedSpaceRecord.get('Google Space ID'),
  slug: slug(importedSpaceRecord.get('Name')),
  descriptionHtml: importedSpaceRecord.get('Description'),
  logoImage: importedSpaceRecord.get('Logo Image'),
  titleImage: importedSpaceRecord.get('Title Image'),
  externalUrl: importedSpaceRecord.get('Site URL'),
  type: importedSpaceRecord.get('Space Type'),
  spaceBasedAt: await generateBasedAtFromPlaceID(importedSpaceRecord.get('Google Space ID')),
});

const extractMakerData = async (importedRecord) => ({
  name: importedRecord.get('Name'),
  slug: slug(importedRecord.get('Name')),
  descriptionHtml: importedRecord.get('Description'),
  logoImage: importedRecord.get('Logo Image'),
  titleImage: importedRecord.get('Title Image'),
  externalUrl: importedRecord.get('Site URL'),
  makerBasedAt: await generateBasedAtFromAddress(importedRecord.get('Location'))
});

const extractItemData = async (importedRecord) => ({
  name: importedRecord.get('Name'),
  maker: await getLocalIdForRemoteId(importedRecord.get('Maker')),
  descriptionHtml: importedRecord.get('Description'),
  titleImage: importedRecord.get('Item Image'),
  externalUrl: importedRecord.get('Shoppable Link'),
});

const extractViewData = async (importedRecord) => ({
  space: await getLocalIdForRemoteId(importedRecord.get('Space')),
  titleImage: importedRecord.get('Closeup Pop Image') || importedRecord.get('Longhost POP Image'),
});

const extractPopData = async (importedRecord) => ({
  view: await getLocalIdForRemoteId(viewRemoteIdGeneratorFromPop(importedRecord.getId())),
  item: await getLocalIdForRemoteId(importedRecord.get('Item')),
  descriptionHtml: importedRecord.get('Description')
});

const importEnabled = {
  'spaces' : 1,
  'makers': 0,
  'items': 0,
  'pops': 0
}

export const runImport = async () => {

  let base = getAirTableBase();

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
    console.log(`got ${pops.length} pops`);
    await storeToDB(pops, View, extractViewData, viewRemoteIdGeneratorFromPop);
    await storeToDB(pops, Pop, extractPopData);
    console.log(`pops+views storing done.`);
  }
}
