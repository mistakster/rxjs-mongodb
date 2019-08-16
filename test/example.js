const { Subject } = require('rxjs');
const { map, mergeAll, takeUntil, finalize } = require('rxjs/operators');
const { streamToRx } = require('rxjs-stream');
const { MongoClient } = require('mongodb');
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
  useUnifiedTopology: true,
  bufferMaxEntries: 0,
  connectTimeoutMS: 5000
};

const client$ = connectMongoDb(new MongoClient(MONGODB_URL, MONGODB_OPTS));

const stop$ = new Subject();

const data$ = client$.pipe(
  map(client => client.db(MONGODB_DATABASE)),
  map(db => db.collection('diagrams')),
  map(items => items.find({})),
  map(cursor => cursor.transformStream()),
  map(stream => streamToRx(stream).pipe(
    finalize(() => {
      stop$.next(true);
      stop$.complete();
    })
  )),
  mergeAll(),
  takeUntil(stop$)
);

data$.subscribe({
  next(datum) {
    console.log(datum._id);
  },
  complete() {
    console.log('finished');
  }
});
