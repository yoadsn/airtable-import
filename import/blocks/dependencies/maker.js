import { extractIdsFromFields, extractSingleValueFromArray } from './utils.js';

export default function(maker) {
  return {
    _id: maker.getId(),
    images: extractIdsFromFields(maker, ['Logo Image', 'Title Image', 'Maker Images'])
  }
}
