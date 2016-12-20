import _ from 'lodash';

export async function filterPendingImportIds(context, ids) {
  if (context.configuration.forceImport) {
    console.log(`Forcing import of all ${ids.length} records`);
    return ids;
  }

  // Which ids have import state?
  let statesOfIdsWithImportState = await context.models.staging.RecordImportState.find({ _id : { $in : ids }, target: context.configuration.importTarget });
  let idsWithImportStates = statesOfIdsWithImportState.map(state => state._id);

  // Which we know nothing about their import state (will have to import those).
  let idsWithUnkownImportState = _.xor(ids, idsWithImportStates);

  // Those who require an import since they were modified after their last import
  let statesOfIdsWithModifyState = await context.models.staging.RecordModifyState.find({ _id : { $in : idsWithImportStates }});

  let importStatesMap = _.keyBy(statesOfIdsWithImportState, state => state._id);
  let modifyStateMap = _.keyBy(statesOfIdsWithModifyState, state => state._id);
  let requireImportMap = _.pickBy(_.assignWith(modifyStateMap, importStatesMap, (modifyVal, importVal) => {
    if (!importVal) return true; // No import state - import.
    if (!modifyVal) return false; // No modify but has import - no need to import;
    return modifyVal.lastModified > importVal.lastImported; // Modified after imported? import;
  }));
  let idsRequiringImport = _.keys(requireImportMap);

  // All who require an import
  let allRequiringImport = _.uniq(idsRequiringImport.concat(idsWithUnkownImportState));
  console.log(`Found ${allRequiringImport.length} records requiring import`);
  return allRequiringImport;
}
