import mongoose, { Schema } from 'mongoose';

var basedAtSchema = Schema({
  address: {
    street1: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  location: {
    type: { type: String },
    coordinates: [Number]
  }
}, { _id : false });

var imageDataStructure = {
  publicId: String,
  creditsTo: String,
  creditsLink: String,
  dimensions : {
    aspectRatio: Number
  }
};

var imageDataSchema = Schema(imageDataStructure, { _id : false});

var imageSchema = Schema(imageDataStructure);

var makerSchema = Schema({
  name: String,
  slug: { type: String, index: true },
  type: String,
  descriptionHtml: String,
  logoImage: imageDataSchema,
  titleImage: imageDataSchema,
  externalUrl: String,
  makerBasedAt: basedAtSchema
})

var itemSchema = Schema({
  name: String,
  descriptionHtml: String,
  titleImage: imageDataSchema,
  externalUrl: String,
  maker: { type: Schema.Types.ObjectId, ref: 'Maker' }
})

var popSchema = Schema({
  descriptionHtml: String,
  externalUrl: String,
  closeupImage: imageDataSchema,
  item: { type: Schema.Types.ObjectId, ref: 'Item', index: true },
  view: { type: Schema.Types.ObjectId, ref: 'View', index: true },
})

var viewSchema = Schema({
  titleImage: imageDataSchema,
  space: { type: Schema.Types.ObjectId, ref: 'Space' }
})

var spaceSchema = Schema({
  name: String,
  googleSpaceId: String,
  slug: { type: String, index: true },
  type: String,
  descriptionHtml: String,
  logoImage: imageDataSchema,
  titleImage: imageDataSchema,
  externalUrl: String,
  spaceBasedAt: basedAtSchema
})

var atIdMapping = Schema({
  localId: Schema.Types.ObjectId,
  remoteId: String
}, {
  collection: 'at_id_mapping'
});

const Maker = mongoose.model('Maker', makerSchema);
const Pop = mongoose.model('Pop', popSchema);
const Item = mongoose.model('Item', itemSchema);
const View = mongoose.model('View', viewSchema);
const Space = mongoose.model('Space', spaceSchema);
const Image = mongoose.model('Image', imageSchema);
const ATIDMapping = mongoose.model('ATIDMapping', atIdMapping);

export {
  Maker,
  Pop,
  Item,
  View,
  Space,
  Image,
  ATIDMapping
};
