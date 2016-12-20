import { Schema } from 'mongoose';
import { imageDataSchema } from './image.js';

export default Schema({
  titleImage: imageDataSchema,
  space: { type: Schema.Types.ObjectId, ref: 'Space' }
})
