import slug from 'slug';
import { getLocalIdForRemoteId } from './ids.js';
import { getImageDataFromImageRemoteId } from './image.js';
import { generateBasedAtFromAddress } from './places.js';

export default async function (context, importedRecord) {
  let remoteId = importedRecord.getId();
  let typeName = importedRecord._table.name;
  return {
    _id: await getLocalIdForRemoteId(context, importedRecord.getId()),
    name: importedRecord.get('Name'),
    slug: slug(importedRecord.get('Name')),
    descriptionHtml: importedRecord.get('Description'),
    logoImage: await getImageDataFromImageRemoteId(context, importedRecord.get('Logo Image'), remoteId, typeName),
    titleImage: await getImageDataFromImageRemoteId(context, importedRecord.get('Title Image'), remoteId, typeName),
    externalUrl: importedRecord.get('Site URL'),
    type: importedRecord.get('Maker Type'),
    basedAt: await generateBasedAtFromAddress(context, importedRecord.get('Location'))
  }
};
