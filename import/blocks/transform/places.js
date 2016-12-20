const getAddressComponentValue = (components, type, nameField) => {
  if (components) {
    let foundComponent = components.find(comp => comp.types.includes(type))
    if (foundComponent) {
      return foundComponent[nameField];
    }
  }

  return null;
}

const generateBasedAtFromGooglePlaceResult = (result) => {
  if (!result) return null;

  let streetNoComp = getAddressComponentValue(result.address_components, 'street_number', 'long_name');
  let routeComp = getAddressComponentValue(result.address_components, 'route', 'short_name');
  let cityComp = getAddressComponentValue(result.address_components, 'locality', 'long_name');
  let stateComp = getAddressComponentValue(result.address_components, 'administrative_area_level_1', 'short_name');
  let zipComp = getAddressComponentValue(result.address_components, 'postal_code', 'long_name');
  let countryComp = getAddressComponentValue(result.address_components, 'country', 'long_name');

  let street = [streetNoComp, routeComp].join(' ').trim();

  return {
    address : {
      street1: street,
      city: cityComp,
      state: stateComp,
      zip: zipComp,
      country: countryComp
    },
    location : {
      type: 'point',
      coordinates: [result.geometry.location.lng, result.geometry.location.lat]
    }
  }
}

const generateBasedAtFromPlaceID = async (context, placeId) => {
  if (context.configuration.skipGoogleApis) {
    console.warn('Skipping calls to Google APIs');
    return null;
  }

  if (!placeId) {
    console.error('Space did not provide a placeId - skipping "basedAt" transformation');
    return null;
  }

  let result = await context.googleMapsClient.place({ placeid: placeId}).asPromise()
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.result))
    .catch(error => {
      console.error(error);
      console.dir(error);
      return null;
    });

  return result;
}

const generateBasedAtFromAddress = async (context, address) => {
  if (context.configuration.skipGoogleApis) {
    console.warn('Skipping calls to Google APIs');
    return null;
  }

  let result = await context.googleMapsClient.geocode({ address }).asPromise()
    .then(response => generateBasedAtFromGooglePlaceResult(response.json.results[0]))
    .then(result => {
      if (result) {
        result.rawAddress = address;
      }
      return result;
    }).catch(error => {
      console.error(error);
      console.dir(error);
    });

  return result;
}

export {
  generateBasedAtFromPlaceID,
  generateBasedAtFromAddress
}
