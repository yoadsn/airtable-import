import {
  SessionStatusEnum,
  MIN_MESSAGE_TS
} from './definitions.js';

const getSessionByConfiguredId = async (context) => {
  const ChangesImportSession  = context.models.staging.ChangesImportSession;
  let { sessionId } = context.configuration;
  let session = await ChangesImportSession.findOne({ _id: sessionId });
  if (!session) throw new Error(`Unable to load session ${sessionId} from the session store`);
  if (!session.status === SessionStatusEnum.initial) throw new Error(`Unable to load a non ${SessionStatusEnum.initial} session ${sessionId}`);
  return session;
}

export async function loadSession(context) {
  const ChangesImportSession  = context.models.staging.ChangesImportSession;

  let session = undefined;
  if (!context.configuration.sessionId) {
    session = await ChangesImportSession.create({
      creationDate: new Date(),
      status: SessionStatusEnum.initial,
    });
    context.configuration.sessionId = session._id;
  } else {
    session = await getSessionByConfiguredId(context);
  }

  let latestCompletedSession = await ChangesImportSession
    .findOne({ status: SessionStatusEnum.completed }, { latestMessageTS: 1 })
    .sort({ completedDate: -1 }).exec();

  let latestMessageTS = MIN_MESSAGE_TS;
  if (latestCompletedSession) {
    latestMessageTS = latestCompletedSession.latestMessageTS || latestMessageTS;
    console.log(`Found a previously completed session with latest message TS: '${latestMessageTS}'`);
  }

  context.info = {
    latestMessageTS,
    importRunDate: session.runDate,
    status: session.status
  }

  await session.save();
}

export async function runSession(context) {
  context.info.status = SessionStatusEnum.running;
  context.info.runDate = new Date();

  await storeSession(context);
}

export async function completeSession(context) {
  context.info.status = SessionStatusEnum.completed;
  context.info.completedDate = new Date();

  await storeSession(context);
}

export async function storeSession(context) {
  let session = await getSessionByConfiguredId(context);

  session.status = context.info.status;
  session.runDate = context.info.runDate;
  session.completedDate = context.info.completedDate;
  session.latestMessageTS = context.info.latestMessageTS;

  await session.save();
}
