import _ from 'lodash'
import warning from 'warning';

const ID_CHUNK_SIZE = 20;


const loadFromAirTable = async (base, table, select) => {
  let allRecords = [];
  return new Promise((res, rej) => {
    base(table).select(select)
    .eachPage((records, fetchNextPage) => {
      console.log(`Loaded ${records.length} records from AirTable table "${table}"`);
      allRecords = allRecords.concat(records);
      fetchNextPage()
    }, (error) => {
      if (error) {
        rej(error)
      }
      res(allRecords);
    })
  });
}

const getFilterStringFromIdsArray = (ids) => `OR(${ids.map(id => `RECORD_ID()="${id}"`).join(',')})`;

const loadRecordsFromAirTableWithFilter = async (base, table, filter, select) => {
  return await loadFromAirTable(base, table, { ...select, filterByFormula: filter })
}

export async function importFromAirtable(context, table, select = {}) {
  warning(context.airtable && context.airtable.base, 'Airtable API is not configured on the context');

  return await loadFromAirTable(context.airtable.base, table, select)
}

export async function importFromAirtableByIds(context, table, ids, select = {}) {
  warning(context.airtable && context.airtable.base, 'Airtable API is not configured on the context');

  // Create chunks of ids
  let idChunks = _.chunk(ids, ID_CHUNK_SIZE);

  // Convert each chunk to a filter String
  let chunkFilters = idChunks.map(getFilterStringFromIdsArray);

  // Execute the import, async & serially for each chunk
  return await chunkFilters.reduce(
    async (recsPromise, currChunkFilter) => (await recsPromise).concat(await loadRecordsFromAirTableWithFilter(context.airtable.base, table, currChunkFilter, select)),
    Promise.resolve([]));
}
