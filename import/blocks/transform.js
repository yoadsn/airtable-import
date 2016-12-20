import _ from 'lodash'
import { transformRecord } from './transform/common.js';

const transformRecords = async (context, records, typeNameGenerator) => {
  return await records.reduce(async (promisedTransformedRecords, currRecord) => {
    let transformedSoFar = await promisedTransformedRecords;
    try {
      let currTransformed = await transformRecord(context, currRecord, typeNameGenerator);
      return {
        records: [...transformedSoFar.records, currTransformed],
        recordIds: [...transformedSoFar.recordIds, currRecord.getId()]
      };
    } catch (error) {
      console.error(`Error while transforming record id: ${currRecord.getId()} - skipped`);
      console.error(error);
    }

    return transformedSoFar;
  }, Promise.resolve({ records: [], recordIds: [] }));
}

export { transformRecords }
