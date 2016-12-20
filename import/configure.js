import slug from 'slug';
import GoogleMaps from '@google/maps';
import cloudinary from 'cloudinary';
import Airtable from 'airtable'
import mongoose, { Schema } from 'mongoose'
import { getModels as getStagingModels } from '../dbschema/staging/models.js';
import { getModels as getOperationalModels } from '../dbschema/operational/models.js';
mongoose.Promise = global.Promise;

/*
 Google Maps Client
*/

const setGoogleMapsClient = (context) => {
  context.googleMapsClient = GoogleMaps.createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: global.Promise
  });
}

/*
 Cloudinary Configurtation
*/

const setCloudinary = (context) => {
  cloudinary.config({
    cloud_name: 'wescover',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  context.cloudinary = cloudinary;
}

/*
 Airtable Configurtation
*/

const setAirTableBase = (context) => {
  context.airtable = {
    base: new Airtable({ apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_NAME)
  }
}

/*
 Database Configurtation
*/

const configureDB = async (context) => {
  context.db = {};
  context.models = {};
  await configureStagingDB(context);
  await configureOperationalDB(context);
}

const cleanupDB = (context) => {
  cleanupStagingDB(context);
  cleanupOperationalDB(context);
}

const configureStagingDB = async (context) => {
  return new Promise((resolve, reject) => {
    var conn = mongoose.createConnection(process.env.STAGING_DB_CONN_STR);
    conn.once('open', () => {
      console.log('Staging DB connection is now open');
      context.db.staging = conn;
      context.models.staging = getStagingModels(conn);
      resolve();
    });
    conn.once('error', (e) => {
      console.dir(e);
      console.error('Staging DB connection error');
      reject();
    });
  });
}

const cleanupStagingDB = (context) => {
  if (context.db.staging)
  {
    console.log('closing connection to the staging DB')
    context.db.staging.close();
  }
}

const configureOperationalDB = async (context) => {
  return new Promise((resolve, reject) => {
    var conn = mongoose.createConnection(process.env.OPERATIONAL_DB_CONN_STR);
    conn.once('open', () => {
      console.log('Operational DB connection is now open');
      context.db.operational = conn;
      context.models.operational = getOperationalModels(conn);
      resolve();
    });
    conn.once('error', (e) => {
      console.dir(e);
      console.error('Operational DB connection error');
      reject();
    });
  });
}

const cleanupOperationalDB = (context) => {
  if (context.db.operational)
  {
    console.log('closing connection to the operational DB')
    context.db.operational.close();
  }
}

/*
* Entry Points
*/

export async function configureWorkflow(context) {
  slug.defaults.mode = 'rfc3986';
  setGoogleMapsClient(context);
  setCloudinary(context);
  setAirTableBase(context);
  await configureDB(context);
}

export async function cleanupWorkflow(context) {
  cleanupDB(context);
}
