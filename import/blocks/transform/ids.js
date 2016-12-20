import mongoose from 'mongoose'

const getLocalIdForRemoteId = async (context, remoteId) => {
  const ATIDMapping = context.models.operational.ATIDMapping;
  let idmap = await ATIDMapping.findOne({ remoteId });
  if (!idmap) {
    idmap = new ATIDMapping({ remoteId, localId: mongoose.Types.ObjectId() });
    await idmap.save();
  }

  return idmap.localId;
}

const viewRemoteIdGeneratorFromPop = (id) => 'view.' + id;

export {
  getLocalIdForRemoteId,
  viewRemoteIdGeneratorFromPop
}
