import { extractIdsFromFields, extractSingleValueFromArray } from './utils.js';

export default function(space) {
  return {
    _id: space.getId(),
    images: extractIdsFromFields(space, ['Logo Image', 'Title Image', 'Space Images'])
  }
}
