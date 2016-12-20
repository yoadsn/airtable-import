import extractPopDependencies from './pop.js';
import extractItemDependencies from './item.js';
import extractSpaceDependencies from './space.js';
import extractMakerDependencies from './maker.js';

const updateDependencies = async (context, Model, doc) => {
  await Model.findOneAndUpdate({ _id: doc._id }, doc, { upsert: true })
}

const loadDependencies = async (context, Model, ids) => {
  let dependenciesDataArray = await Model.find({ _id : { $in : ids}});
  return dependenciesDataArray.map(doc => doc.toObject());
}

const getModelForType = (context, type) => {
  let models = context.models.staging;
  let Model = undefined;
  switch (type) {
    case 'Pops': {
      Model = models.PopDependency;
      break;
    }
    case 'Items': {
      Model = models.ItemDependency;
      break;
    }
    case 'Spaces': {
      Model = models.SpaceDependency;
      break;
    }
    case 'Makers': {
      Model = models.MakerDependency;
      break;
    }
    default: {
      console.warn(`Unknown record type ${type} - Model cannot be found`);
    }
  }

  return Model;
}

const extractDependenciesForType = (type, record) => {
  switch (type) {
    case 'Pops': {
      return extractPopDependencies(record);
    }
    case 'Items': {
      return extractItemDependencies(record);
    }
    case 'Spaces': {
      return extractSpaceDependencies(record);
      break;
    }
    case 'Makers': {
      return extractMakerDependencies(record);
      break;
    }
    default: {
      console.warn(`Unknown record type from table ${record._table.name} - dependnecy extraction skipped`);
    }
  }
}

export {
  updateDependencies,
  loadDependencies,
  getModelForType,
  extractDependenciesForType
};
