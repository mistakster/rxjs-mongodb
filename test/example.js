const { from, timer } = require('rxjs');
const { map, mergeAll, takeUntil } = require('rxjs/operators');
const { streamToRx } = require('rxjs-stream');
const connectMongoDb = require('../lib/connect');

const {
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_URL,
  MONGODB_DATABASE
} = process.env;

const MONGODB_OPTS = {
  auth: {
    user: MONGODB_USER,
    password: MONGODB_PASSWORD
  },
  ssl: true,
  connectWithNoPrimary: false,
  useNewUrlParser: true,
  bufferMaxEntries: 0,
  connectTimeoutMS: 5000
};

const client$ = connectMongoDb(MONGODB_URL, MONGODB_OPTS);

const data$ = client$.pipe(
  map(client => client.db(MONGODB_DATABASE)),
  map(db => db.collection('diagrams')),
  map(items => items.find({})),
  map(cursor => cursor.transformStream()),
  map(streamToRx),
  mergeAll(),
  takeUntil(timer(5000))
);

data$.subscribe(datum => {
  console.log(datum._id);
});
