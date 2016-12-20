import { WebClient as SlackWebClientCreator } from '@slack/client'
import Airtable from 'airtable'
import mongoose, { Schema } from 'mongoose'
import { getModels as getStagingModels } from '../dbschema/staging/models.js';
mongoose.Promise = global.Promise;

/*
Slack Integration
*/

const setSlack = (context) => {
  context.slack = new SlackWebClientCreator(process.env.SLACK_API_TOKEN);
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
}

const cleanupDB = (context) => {
  cleanupStagingDB(context);
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

/*
* Entry Points
*/

export async function configureWorkflow(context) {
  setSlack(context);
  setAirTableBase(context);
  await configureDB(context);
}

export async function cleanupWorkflow(context) {
  cleanupDB(context);
}
