import { Schema } from 'mongoose';

export default Schema({
  publicId: { type: String, index: true },
  info : {
    width: Number,
    height: Number,
    leadColor: String,
    created_at: Date,
    version: Number
  }
},{
  collection: 'cd_image_info_cache'
})
