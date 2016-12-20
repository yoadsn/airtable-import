import { Schema } from 'mongoose';
import { imageDataSchema } from './image.js';

export default Schema({
  name: String,
  descriptionHtml: String,
  titleImage: imageDataSchema,
  externalUrl: String,
  maker: { type: Schema.Types.ObjectId, ref: 'Maker' }
})
