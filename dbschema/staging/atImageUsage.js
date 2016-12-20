import { Schema } from 'mongoose';

export default Schema({
  imageRemoteId: { type: String, index: true },
  typeName: String,
  usedAtRemoteId: String
},{
  collection: 'at_image_usage'
})
