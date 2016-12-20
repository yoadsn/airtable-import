import _ from 'lodash'
import { configureWorkflow, cleanupWorkflow } from './configure.js';
import extractSlackMessages from './blocks/extractSlackMessages.js';
import parseChangeHistoryMessages from './blocks/parseChangeHistoryMessages.js';
import updateModifyState from './blocks/updateModifyState.js';
import { loadSession, runSession, storeSession, completeSession } from './session.js';

export async function run(configuration = {}) {
  let context = {};

  try {
    context.configuration = {
      maxMessagesPerCall: 5,
      maxMessagesToImport: 5,
      ...configuration
    }

    console.log('STEP: Workflow Configuration')

    await configureWorkflow(context);

    console.log('STEP: Session Load')

    await loadSession(context);

    console.log('STEP: Run Session')
    await runSession(context);

    console.log('STEP: Get Slack Messages')
    let latestMessages = await extractSlackMessages(context);

    console.log('STEP: Parse Slack Messages to Changes')
    let changes = await parseChangeHistoryMessages(context, latestMessages);

    console.log('STEP: Update modify state of changed records');
    await updateModifyState(context, changes);

    console.log('STEP: Complete Session');
    await completeSession(context);
  }
  finally {
    console.log('STEP: Workflow cleanup')
    cleanupWorkflow(context);
  }
}
