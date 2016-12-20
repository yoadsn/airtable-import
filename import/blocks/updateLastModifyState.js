export async function updateLastModifyState(context, idsToUpdate) {
  // Set a modify date of start of time - we don't know any better about those (imported) records.
  let defaultLastModifyState = { $setOnInsert: { lastModified: new Date(0) } };
  await idsToUpdate.reduce(async (prevPromise, currId) => {
    await prevPromise;
    await context.models.staging.RecordModifyState.findOneAndUpdate({ _id: currId }, defaultLastModifyState , { upsert: true });
  }, Promise.resolve());
  console.log(`Updated/Inserted ${idsToUpdate.length} modification states`);
}
