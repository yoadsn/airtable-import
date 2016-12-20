export default async function updateModifyState(context, changes) {
  // The time of the import run is considered the time
  // the records are modified. In practive they are modified before but this only makes
  // it more robust in case an records import ran while the changes are done. (which is not known to the import run)
  let latestModifyState = { lastModified: context.info.importRunDate };
  await changes.reduce(async (previousPromise, currChange) => {
    await previousPromise;
    await context.models.staging.RecordModifyState.findOneAndUpdate({ _id: currChange.record }, latestModifyState , { upsert: true });
  }, Promise.resolve());
  console.log(`Updated modification state for ${changes.length} records`);
}
