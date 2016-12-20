import { getLocalIdForRemoteId } from './ids.js';
import { getImageDataFromImageRemoteId } from './image.js';

export default async function (context, importedRecord) {
  let remoteId = importedRecord.getId();
  let typeName = importedRecord._table.name;
  return {
    _id: await getLocalIdForRemoteId(context, importedRecord.getId()),
    name: importedRecord.get('Name'),
    maker: await getLocalIdForRemoteId(context, importedRecord.get('Maker')),
    descriptionHtml: importedRecord.get('Description'),
    titleImage: await getImageDataFromImageRemoteId(context, importedRecord.get('Item Image'), remoteId, typeName),
    externalUrl: importedRecord.get('Shoppable Link'),
  }
};
