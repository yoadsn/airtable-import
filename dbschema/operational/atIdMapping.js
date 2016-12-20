import { Schema } from 'mongoose';

export default Schema({
  localId: Schema.Types.ObjectId,
  remoteId: { type: String, index: true },
}, {
  collection: 'at_id_mapping'
});
