import ImageSchema from './image.js';
import PopSchema from './pop.js';
import ItemSchema from './item.js';
import MakerSchema from './maker.js';
import ViewSchema from './view.js';
import SpaceSchema from './space.js';
import ATIDMappingSchema from './atIdMapping.js';

export function getModels(connection) {
  const Image = connection.model('Image', ImageSchema);
  const Pop = connection.model('Pop', PopSchema);
  const Item = connection.model('Item', ItemSchema);
  const Maker = connection.model('Maker', MakerSchema);
  const View = connection.model('View', ViewSchema);
  const Space = connection.model('Space', SpaceSchema);
  const ATIDMapping = connection.model('ATIDMapping', ATIDMappingSchema);

  return {
    Image,
    Pop,
    Item,
    Maker,
    View,
    Space,
    ATIDMapping
  }
}
