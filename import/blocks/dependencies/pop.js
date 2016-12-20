import { extractIdsFromFields, extractSingleValueFromArray } from './utils.js';

export default function(pop) {
  return {
    _id: pop.getId(),
    images: extractIdsFromFields(pop, ['Longhost POP Image', 'Closeup POP Image', 'Additional Pop Images']),
    item: extractSingleValueFromArray(pop.get('Item')),
    space: extractSingleValueFromArray(pop.get('Space'))
  }
}
