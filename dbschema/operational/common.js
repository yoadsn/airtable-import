import { Schema } from 'mongoose';

const basedAtSchema = Schema({
  address: {
    street1: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  rawAddress: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  }
}, { _id : false });

export {
  basedAtSchema
};
