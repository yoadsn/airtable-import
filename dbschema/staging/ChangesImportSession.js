import { Schema } from 'mongoose';

export default Schema({
  creationDate: Date,
  runDate: Date,
  completedDate: Date,
  status: String,
  latestMessageTS: String
});
