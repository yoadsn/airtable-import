import mongoose, { Schema } from 'mongoose'
import PrettyError from 'pretty-error';
mongoose.Promise = global.Promise;
import { runImport } from './import.js';
//import { run as runImport } from './import/workflow.js';
import { run as runChangeTracking } from './changeTracking/workflow.js';

let pe = new PrettyError();

// To render exceptions thrown in non-promies code:
process.on('uncaughtException', function(error){
   console.log(pe.render(error));
});

/*
let testPopIds = ['recmhbez1PQBAqS5j'];
//run({ rootMode: 'allCompleted' }).then(res => {
runImport({ rootMode: 'specifiedIds', popIds: testPopIds, forceImport: false, skipGoogleApis: false }).then(res => {
  console.log('Import Process Done.');
}).catch(err => {
  console.log('rejection occured');
  console.log(pe.render(err));
});
*/

/*
runChangeTracking({
  slackChannelId: process.env.SLACK_AIRTABLE_ACTIVITY_CHANNEL
}).then(res => {
  console.log('Change Tracking Process Done.');
}).catch(err => {
  console.log('rejection occured');
  console.log(pe.render(err));
});
*/


mongoose.connect('mongodb://localhost/wescoveraround');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Starting Import Process');
  runImport().then(res => {
    console.log('Import Process Done.');
    db.close();
  }).catch(err => console.error(err));
});
