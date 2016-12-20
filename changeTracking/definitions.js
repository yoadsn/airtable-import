const MIN_MESSAGE_TS = new Date(1000) / 1000;

const SessionStatusEnum = {
  initial: 'INITIAL',
  running: 'RUNNING',
  completed: 'COMPLETED'
};

export {
  MIN_MESSAGE_TS,
  SessionStatusEnum
};
