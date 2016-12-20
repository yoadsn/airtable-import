const extractSingleValueFromArray = (array) => {
  if (!array || !array.length) return null
  return array[0];
}

const extractIdsFromFields = (record, fieldsArr) => {
  let allImageIds = [];
  fieldsArr.map(fieldName => {
    let fieldValue = record.get(fieldName);
    if (fieldValue) {
      if (Array.isArray(fieldValue)) {
        allImageIds = allImageIds.concat(fieldValue);
      } else {
        allImageIds.push(fieldValue);
      }
    }
  });

  return allImageIds;
}

export {
  extractSingleValueFromArray,
  extractIdsFromFields
}
