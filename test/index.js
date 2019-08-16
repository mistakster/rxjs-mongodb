const { merge, NEVER } = require('rxjs');
const { map, share, mergeMap, take } = require('rxjs/operators');
const { create } = require('rxjs-spy');
const { tag } = require('rxjs-spy/operators');
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
  connectWithNoPrimary: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferMaxEntries: 0,
  connectTimeoutMS: 5000
};

const spy = create();

spy.log(/^test:/);

const client$ = connectMongoDb(new MongoClient(MONGODB_URL, MONGODB_OPTS))
  .pipe(
    tag('test:client'),
    share()
  );

const db$ = client$
  .pipe(
    map(client => ({
      db: client.db(MONGODB_DATABASE),
      client
    })),
    tag('test:database'),
    mergeMap(({ client }) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 5000);
      });
    }),
    take(1),
    tag('test:logic')
  );

db$
  .pipe(
    tag('test:merged')
  )
  .subscribe({
    error: spy.teardown.bind(spy),
    complete: spy.teardown.bind(spy)
  });
