import { getLocalIdForRemoteId, viewRemoteIdGeneratorFromPop } from './ids.js';
import { getImageDataFromImageRemoteId } from './image.js';

export default async function (context, importedRecord) {
  let remoteId = importedRecord.getId();
  let typeName = `${importedRecord._table.name}.Views`;
  return {
    _id: await getLocalIdForRemoteId(context, viewRemoteIdGeneratorFromPop(importedRecord.getId())),
    space: await getLocalIdForRemoteId(context, importedRecord.get('Space')),
    titleImage: await getImageDataFromImageRemoteId(context, importedRecord.get('Longhost POP Image'), remoteId, typeName)
  }
};
