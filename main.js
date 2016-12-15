import mongoose, { Schema } from 'mongoose'
mongoose.Promise = global.Promise;
import { runImport } from './import.js';

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
