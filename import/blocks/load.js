const getModelForType = (context, type) => {
  let models = context.models.operational;
  let Model = undefined;
  switch (type) {
    case 'Pops': {
      Model = models.Pop;
      break;
    }
    case 'Items': {
      Model = models.Item;
      break;
    }
    case 'Spaces': {
      Model = models.Space;
      break;
    }
    case 'Makers': {
      Model = models.Maker;
      break;
    }
    case 'Views': {
      Model = models.View;
      break;
    }
    case 'Images': {
      Model = models.Image;
      break;
    }
    default: {
      console.warn(`Unknown record type ${type} - Model cannot be found`);
    }
  }

  return Model;
}

export async function loadIntoDB(context, docs, type) {
  const Model = getModelForType(context, type);
  await docs.reduce(async (previousPromise, currDoc) => {
    await previousPromise;
    await Model.findOneAndUpdate({ _id: currDoc._id }, currDoc, { upsert: true });
  }, Promise.resolve())
  console.log(`Stored ${docs.length} documents in the operational database`);
}
