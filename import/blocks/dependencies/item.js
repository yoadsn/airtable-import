import { extractIdsFromFields, extractSingleValueFromArray } from './utils.js';

export default function(item) {
  return {
    _id: item.getId(),
    images: extractIdsFromFields(item, ['Item Image', 'Additional Item Images']),
    maker: extractSingleValueFromArray(item.get('Maker'))
  }
}
