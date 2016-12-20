import PopDependencySchema from './PopDependency.js';
import ItemDependencySchema from './ItemDependency.js';
import SpaceDependencySchema from './SpaceDependency.js';
import MakerDependencySchema from './MakerDependency.js';
import RecordModifyStateSchema from './RecordModifyState.js';
import RecordImportStateSchema from './RecordImportState.js';
import CDImageInfoCacheSchema from './cdImageInfoCache.js';
import ATImageUsageSchema from './atImageUsage.js';
import ChangesImportSessionSchema from './ChangesImportSession.js';

export function getModels(connection) {
  const PopDependency = connection.model('PopDependency', PopDependencySchema);
  const ItemDependency = connection.model('ItemDependency', ItemDependencySchema);
  const SpaceDependency = connection.model('SpaceDependency', SpaceDependencySchema);
  const MakerDependency = connection.model('MakerDependency', MakerDependencySchema);
  const RecordModifyState = connection.model('RecordModifyState', RecordModifyStateSchema);
  const RecordImportState = connection.model('RecordImportState', RecordImportStateSchema);
  const CDImageInfoCache = connection.model('CDImageInfoCache', CDImageInfoCacheSchema);
  const ATImageUsage = connection.model('ATImageUsage', ATImageUsageSchema);
  const ChangesImportSession = connection.model('ChangeImportSession', ChangesImportSessionSchema);

  return {
    PopDependency,
    ItemDependency,
    SpaceDependency,
    MakerDependency,
    RecordModifyState,
    RecordImportState,
    CDImageInfoCache,
    ATImageUsage,
    ChangesImportSession
  }
}
