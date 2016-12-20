import mongoose from 'mongoose'
import transformImageRecord from './image.js';
import transformPopRecord from './pop.js';
import transformItemRecord from './item.js';
import transformMakerRecord from './maker.js';
import transformSpaceRecord from './space.js';
import transformViewRecord from './view.js';

const transformRecord = async (context, record, typeNameGenerator = (record) => record._table.name) => {
  let type = typeNameGenerator(record);
  switch (type) {
    case 'Images': {
      return await transformImageRecord(context, record);
    }
    case 'Pops': {
      return await transformPopRecord(context, record);
    }
    case 'Items': {
      return await transformItemRecord(context, record);
    }
    case 'Spaces': {
      return await transformSpaceRecord(context, record);
    }
    case 'Makers': {
      return await transformMakerRecord(context, record);
    }
    case 'Pops.Views': {
      return await transformViewRecord(context, record);
    }
    default: {
      console.warn(`Unknown record type ${type} - record transformation skipped`);
    }
  }
}

export {
  transformRecord
}
