import _ from 'lodash';
import { WebClient as SlackWebClientCreator } from '@slack/client'

const airtableActivitySlackChannelId = 'C30RWN4JY'; // The Slack ID of the channel
const slackWebClient = new SlackWebClientCreator(process.env.SLACK_API_TOKEN)
const recordFromLinkRegexp = /[^\/]+?$/ // then entire match
const tableFromLinkRegexp = /\/([^\/]+?)\/[^\/]+?$/ // the first capture group

const getSlackChannelHistory = async (channelId, since) => {
  return new Promise((res, rej) => {
    //{ oldest: since }
    slackWebClient.channels.history(channelId, (err, info) => {
      if (err) {
        rej(err);
      }
      res(info);
    })
  })
}

const parseSlackMessage = (message) => {
  let parsed = [];
  if (message.type === 'message' && message.subtype === 'bot_message' && message.attachments) {
    let changes = message.attachments.map(attachment => {
      let record = {};
      try {
        let recordLink = attachment.title_link;
        let recordId = recordFromLinkRegexp.exec(recordLink)[0]
        let tableId = tableFromLinkRegexp.exec(recordLink)[1]
        record.table = tableId;
        record.record = recordId;
      } catch (err) {
        console.error(err)
      }
      return record;
    }).filter(change => change.table && change.record);

    parsed = changes;
  }

  return parsed;
}

const collapseChanges = (groupedChanges) => {
  let uniqueChanges = _.uniqBy(_.flatten(groupedChanges), change => `${change.table}-${change.record}`);
  return uniqueChanges;
}

const parseChangesFromSlackHistory = (history) => {
  let changes = [];
  if (history.ok) {
    let groupedChanges = history.messages
        .map(message => parseSlackMessage(message))
        .filter(group => group.length > 0);

    changes = collapseChanges(groupedChanges);
  }

  return changes;
}

// Entry point
// Someday support retrieval by base
const getBaseChanges = async (basedId, since) => {
  try {
    let historyResponse = await getSlackChannelHistory(airtableActivitySlackChannelId, since);
    return parseChangesFromSlackHistory(historyResponse);
  } catch (err) {
    console.error(err);
  }

  return [];
}

export default getBaseChanges;
