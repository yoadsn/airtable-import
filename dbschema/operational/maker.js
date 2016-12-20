import { Schema } from 'mongoose';
import { imageDataSchema } from './image.js';
import { basedAtSchema } from './common.js';

export default Schema({
  name: String,
  slug: { type: String, index: true },
  type: String,
  descriptionHtml: String,
  logoImage: imageDataSchema,
  titleImage: imageDataSchema,
  externalUrl: String,
  basedAt: basedAtSchema
})
