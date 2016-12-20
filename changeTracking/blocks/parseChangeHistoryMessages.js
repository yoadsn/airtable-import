import _ from 'lodash'

const tableNameFromTextRegexp = /table \*(.+?)\*/ // the first capture group
const recordFromLinkRegexp = /[^\/]+?$/ // the entire match
const tableFromLinkRegexp = /\/([^\/]+?)\/[^\/]+?$/ // the first capture group

const parseSlackMessage = (message) => {
  let parsed = [];
  if (message.type === 'message' && message.subtype === 'bot_message' && message.attachments) {
    let tableName = tableNameFromTextRegexp.exec(message.text)[1];
    let changes = message.attachments.map(attachment => {
      let change = {};
      try {
        let recordLink = attachment.title_link;
        let recordId = recordFromLinkRegexp.exec(recordLink)[0]
        let tableId = tableFromLinkRegexp.exec(recordLink)[1]
        change.table = tableName;
        change.tableId = tableId;
        change.record = recordId;
      } catch (err) {
        console.error(err)
      }
      return change;
    }).filter(change => change.table && change.record);

    parsed = changes;
  }

  return parsed;
}

const collapseChanges = (groupedChanges) => {
  let uniqueChanges = _.uniqBy(_.flatten(groupedChanges), change => `${change.table}-${change.record}`);
  return uniqueChanges;
}

const removeDuplicateChanges = (changes) => {
  return _.uniqBy(changes, change => change.record);
}

export default async function parseChangehistoryMessages(context, messages) {
  let groupedChanges = messages
      .map(message => parseSlackMessage(message))
      .filter(changesGroup => changesGroup.length > 0);

  let changes = removeDuplicateChanges(collapseChanges(groupedChanges));

  console.log(`Parsed ${changes.length} record changes from ${messages.length} history messages`);
  return changes;
}
