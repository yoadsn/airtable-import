import { Schema } from 'mongoose';

export default Schema({
  _id: String,
  target: String,
  lastImported: Date
});
