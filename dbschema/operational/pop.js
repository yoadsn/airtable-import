import { Schema } from 'mongoose';
import { imageDataSchema } from './image.js';

export default Schema({
  descriptionHtml: String,
  externalUrl: String,
  closeupImage: imageDataSchema,
  item: { type: Schema.Types.ObjectId, ref: 'Item', index: true },
  view: { type: Schema.Types.ObjectId, ref: 'View', index: true },
})
