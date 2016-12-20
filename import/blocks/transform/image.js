import { getLocalIdForRemoteId } from './ids.js';

const getImageInformation = async (context, publicId) => {
  const CDImageInfoCache = context.models.staging.CDImageInfoCache;
  let cachedInfo  = await CDImageInfoCache.findOne({ publicId });
  if (cachedInfo) {
      //console.log('used cached image info');
      return cachedInfo.toObject().info;
  } else {
    let result = await new Promise((res, rej) => {
      //console.log('Need to consult cloudinary api');
      context.cloudinary.api.resource(publicId, imageInfo => {
        if (imageInfo.error) {
          rej(imageInfo.error)
        } else {
          res({
            version: imageInfo.version,
            created_at: imageInfo.created_at,
            width: imageInfo.width,
            height: imageInfo.height,
            leadColor: imageInfo.colors[0][0]
          });
        }
      }, {
        colors: true
      });
    }).catch(err => {
      console.error(err);
      return null;
    });

    if (result) {
      //console.log('storing image cache');
      await CDImageInfoCache.create({ publicId, info: result });
    }

    return result;
  }
}

const extractExtraImageInformation = async (context, publicId) => {
  let imageData = await getImageInformation(context, publicId);

  return imageData && {
    dimensions: {
        aspectRatio: imageData.width / imageData.height
    },
    metadata: {
      leadColor: imageData.leadColor
    }
  }
}

const getImageDataFromImageRemoteId = async (context, imageRemoteId, usageRemoteId, typeName) => {
  // imageRemoteId is an array of a single value.
  if (!imageRemoteId || imageRemoteId.length == 0) return null;
  let localImageId = await getLocalIdForRemoteId(context, imageRemoteId[0]);
  const Image = context.models.operational.Image;
  let image = await Image.findOne({ _id: localImageId});
  if (image) {
    // Store this image usage if not mapped already
    const ATImageUsage = context.models.staging.ATImageUsage;
    let foundUsage = await ATImageUsage.find({ imageRemoteId, usedAtRemoteId: usageRemoteId });
    if (foundUsage.length === 0) {
      let usage = new ATImageUsage({ imageRemoteId, typeName, usedAtRemoteId: usageRemoteId})
      await usage.save();
    }
  }
  return image && image.toObject();
}

export default async function (context, importedRecord) {
  return {
    _id: await getLocalIdForRemoteId(context, importedRecord.getId()),
    publicId: importedRecord.get('Public ID'),
    creditsTo: importedRecord.get('Credits To'),
    creditsLink: importedRecord.get('Credits Link'),
    ...(await extractExtraImageInformation(context, importedRecord.get('Public ID')))
  }
};

export { getImageDataFromImageRemoteId };
