import { Schema } from 'mongoose';

export default Schema({
  _id: String,
  images: [String],
  item: String,
  space: String
});
