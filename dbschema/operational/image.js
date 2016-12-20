import { Schema } from 'mongoose';

const imageDataStructure = {
  publicId: String,
  creditsTo: String,
  creditsLink: String,
  dimensions : {
    aspectRatio: Number
  },
  metadata: {
    leadColor: String
  }
};

const imageDataSchema = Schema(imageDataStructure, { _id : false});

let imageSchema = Schema(imageDataStructure);

export default imageSchema;

export { imageDataSchema }
