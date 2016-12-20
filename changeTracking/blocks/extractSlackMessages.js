import _ from 'lodash'
import { MIN_MESSAGE_TS } from '../definitions.js';

const loadHistoryFromSlackChannel = (context, oldest = 0) => {
  return new Promise((res, rej) => {
    context.slack.channels.history(context.configuration.slackChannelId, {
      oldest,
      count: context.configuration.maxMessagesPerCall || 100
    }, (err, info) => {
      if (err) {
        rej(err);
      }

      if (info.ok) {
        res(info);
      } else {
        rej('Slack response is NOT ok');
      }
    })
  });
}

const getLatestTsOfMessages = (messages) => {
  if (messages && messages.length) {
    const latestMessage = _.maxBy(messages, message => message.ts);
    return latestMessage && latestMessage.ts;
  }
  return null;
}

export default async function extractMessages(context) {
  let maxMessagesToImport = context.configuration.maxMessagesToImport || 0;
  let latestMessageSoFar = context.info.latestMessageTS;
  let hasMore = true;
  let allMessages = [];
  do {
    console.log('before load form slack')
    let response = await loadHistoryFromSlackChannel(context, latestMessageSoFar);
    hasMore = response.has_more;
    latestMessageSoFar = getLatestTsOfMessages(response.messages) || latestMessageSoFar;
    allMessages = allMessages.concat(response.messages);
    console.log(`latest: ${latestMessageSoFar}, has_more: ${hasMore}, totalMessages: ${allMessages.length}`);
  } while (hasMore && (maxMessagesToImport > 0 && allMessages.length < maxMessagesToImport));

  context.info.latestMessageTS = latestMessageSoFar

  console.log(`Loaded ${allMessages.length} history messages`);
  return allMessages;
}
