export async function updateLastImportState(context, idsToUpdate) {
  let thisImportTarget = context.configuration.importTarget;
  let thisImportTime = context.info.currImportDate;
  let lastImportState = {
    target: thisImportTarget,
    lastImported: thisImportTime
  };
  await idsToUpdate.reduce(async (prevPromise, currId) => {
    await prevPromise;
    await context.models.staging.RecordImportState.findOneAndUpdate({ _id: currId }, lastImportState , { upsert: true });
  }, Promise.resolve());
  console.log(`Updated/Inserted ${idsToUpdate.length} import states`);
}
