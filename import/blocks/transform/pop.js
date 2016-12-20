import { getLocalIdForRemoteId, viewRemoteIdGeneratorFromPop } from './ids.js';
import { getImageDataFromImageRemoteId } from './image.js';

export default async function (context, importedRecord) {
  let remoteId = importedRecord.getId();
  let typeName = importedRecord._table.name;
  return {
    _id: await getLocalIdForRemoteId(context, importedRecord.getId()),
    view: await getLocalIdForRemoteId(context, viewRemoteIdGeneratorFromPop(importedRecord.getId())),
    item: await getLocalIdForRemoteId(context, importedRecord.get('Item')),
    descriptionHtml: importedRecord.get('Description'),
    closeupImage: await getImageDataFromImageRemoteId(context, importedRecord.get('Closeup POP Image'), remoteId, typeName)
  }
};
