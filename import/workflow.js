import _ from 'lodash'
import { configureWorkflow, cleanupWorkflow } from './configure.js';
import { importFromAirtable, importFromAirtableByIds } from './blocks/importFromAirtable.js';
import { updateDependenciesForRecords, loadDependenciesForTypeIds, getUniqueDependencyIdsForField } from './blocks/dependencies.js';
import { filterPendingImportIds } from './blocks/filterPendingImportIds.js';
import { updateLastModifyState } from './blocks/updateLastModifyState.js';
import { updateLastImportState } from './blocks/updateLastImportState.js';
import { transformRecords } from './blocks/transform.js';
import { loadIntoDB } from './blocks/load.js';

export async function run(configuration = {}) {
  let context = {};

  try {
    // Needs to be loaded / configured from staging DB in some way.
    context.info = {
      currImportDate: new Date()
    };

    context.configuration = {
      importTarget: 'default',
      forceImport: false,
      ...configuration
    }

    console.log('STEP: Workflow Configuration')

    await configureWorkflow(context);

    console.log('STEP: Initial POP List determination')

    // prepare list of pops to start from
    let rootPopIds = [];
    let { rootMode, popIds } = context.configuration;
    if (rootMode === 'allCompleted') {
      let completedPops = await importFromAirtable(context, 'Pops', { filterByFormula: `{Work Status}="Completed"`, fields: ['ID'] });
      completedPops.map(pop => pop.getId());
    } else if (rootMode === 'specifiedIds') {
      rootPopIds = popIds;
    }

    // Pops
    console.log('STEP: Extracting POP data')

    // import pop records from airtable
    let importedPops = await importFromAirtableByIds(context, 'Pops', rootPopIds);
    // update dependency graph - pop nodes
    await updateDependenciesForRecords(context, importedPops);

    // Get all dependencies for the above pop from the database
    let popsDependencies = await loadDependenciesForTypeIds(context, 'Pops', rootPopIds);
    // extract items ids from pops
    let dependentItemIds = getUniqueDependencyIdsForField(popsDependencies, 'item');
    // extract spaces ids from pops
    let dependentSpaceIds = getUniqueDependencyIdsForField(popsDependencies, 'space');
    // extract images ids from pops
    let dependentPopImageIds = getUniqueDependencyIdsForField(popsDependencies, 'images');

    // Items
    console.log('STEP: Extracting Item data')

    // filter out unmodified items since last import
    let itemsRequiringImport = await filterPendingImportIds(context, dependentItemIds);
    // import item records from airtable
    let importedItems = await importFromAirtableByIds(context, 'Items', itemsRequiringImport);
    // update dependency graph - items nodes
    await updateDependenciesForRecords(context, importedItems);

    let itemDependencies = await loadDependenciesForTypeIds(context, 'Items', dependentItemIds);
    // extract maker ids from items
    let dependentMakerIds = getUniqueDependencyIdsForField(itemDependencies, 'maker');
    // extract images ids from items
    let dependentItemImageIds = getUniqueDependencyIdsForField(itemDependencies, 'images');

    // Space
    console.log('STEP: Extracting Space data')

    // filter out unmodified spaces since last import
    let spacesRequiringImport = await filterPendingImportIds(context, dependentSpaceIds);
    // import space records from airtable
    let importedSpaces = await importFromAirtableByIds(context, 'Spaces', spacesRequiringImport);
    // update dependency graph - space nodes
    await updateDependenciesForRecords(context, importedSpaces);

    let spacesDependencies = await loadDependenciesForTypeIds(context, 'Spaces', dependentSpaceIds);
    // extract images ids from spaces
    let dependentSpaceImageIds = getUniqueDependencyIdsForField(spacesDependencies, 'images');

    // Maker
    console.log('STEP: Extracting Maker data')

    // filter out unmodified makers since last import
    let makersRequiringImport = await filterPendingImportIds(context, dependentMakerIds);
    // import maker records from airtable
    let importedMakers = await importFromAirtableByIds(context, 'Makers', makersRequiringImport);

    // update dependency graph - makers nodes
    await updateDependenciesForRecords(context, importedMakers);

    let makersDependencies = await loadDependenciesForTypeIds(context, 'Makers', dependentMakerIds);
    // extract images ids from spaces
    let dependentMakerImageIds = getUniqueDependencyIdsForField(makersDependencies, 'images');

    // Image
    console.log('STEP: Extracting Image data')

    let allDependentImages = _.union(
      dependentPopImageIds,
      dependentItemImageIds,
      dependentSpaceImageIds,
      dependentMakerImageIds);

    // filter out unmodified images since last import
    let imagesRequiringImport = await filterPendingImportIds(context, allDependentImages);
    // import images from airtable
    let importedImages = await importFromAirtableByIds(context, 'Images', imagesRequiringImport, { fields : ['Public ID', 'Credits To', 'Credits Link'] });

    // Transform  & load

    // Images
    console.log('STEP: Transform & Load Images')
    // transform
    let transformedImages = await transformRecords(context, importedImages);
    // load
    await loadIntoDB(context, transformedImages.records, 'Images');
    await updateLastImportState(context, transformedImages.recordIds);

    // Pops
    console.log('STEP: Transform & Load POPs')
    // transform
    let transformedPops = await transformRecords(context, importedPops);
    // load
    await loadIntoDB(context, transformedPops.records, 'Pops');
    await updateLastImportState(context, transformedPops.recordIds);

    // Views
    console.log('STEP: Transform & Load Views')
    // transform
    let transformedViews = await transformRecords(context, importedPops, (record) => `${record._table.name}.Views`);
    // load
    await loadIntoDB(context, transformedViews.records, 'Views');

    // Items
    console.log('STEP: Transform & Load Items')
    // transform
    let transformedItems = await transformRecords(context, importedItems);
    // load
    await loadIntoDB(context, transformedItems.records, 'Items');
    await updateLastImportState(context, transformedItems.recordIds);

    // Makers
    console.log('STEP: Transform & Load Makers')
    // transform
    let transformedMakers = await transformRecords(context, importedMakers);
    // load
    await loadIntoDB(context, transformedMakers.records, 'Makers');
    await updateLastImportState(context, transformedMakers.recordIds);

    // Spaces
    console.log('STEP: Transform & Load Spaces')
    // transform
    let transformedSpaces = await transformRecords(context, importedSpaces);
    // load
    await loadIntoDB(context, transformedSpaces.records, 'Spaces');
    await updateLastImportState(context, transformedSpaces.recordIds);
  }
  finally {
    console.log('STEP: Workflow cleanup')
    cleanupWorkflow(context);
  }
}
