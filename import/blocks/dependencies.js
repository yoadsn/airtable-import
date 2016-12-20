import _ from 'lodash'
import {
  loadDependencies,
  updateDependencies,
  getModelForType,
  extractDependenciesForType } from './dependencies/common.js';

const updateDependenciesForRecord = async (context, record) => {
  let type = record._table.name;
  let Model = getModelForType(context, type);
  if (Model) {
    let dependenciesData = extractDependenciesForType(type, record);
    await updateDependencies(context, Model, dependenciesData);
  }
}

export async function updateDependenciesForRecords(context, records) {
  return await records.reduce(async (promisedUpdate, currRecord) => ((await promisedUpdate) || updateDependenciesForRecord(context, currRecord)), Promise.resolve());
}

export async function loadDependenciesForTypeIds(context, type, ids) {
  let Model = getModelForType(context, type);
  if (Model) return await loadDependencies(context, Model, ids)
}

export function getUniqueDependencyIdsForField(records, field) {
  let isArrayField = undefined;
  return _.uniq(records.reduce((allIds, currRecord) => {
    if (isArrayField === undefined) {
      if (!currRecord[field]) return allIds;
      isArrayField = Array.isArray(currRecord[field]);
    }
    let valueToConcat;
    if (isArrayField) {
      valueToConcat = currRecord[field];
    } else {
      valueToConcat = [currRecord[field]];
    }
    return allIds.concat(valueToConcat);
  },[]));
}
