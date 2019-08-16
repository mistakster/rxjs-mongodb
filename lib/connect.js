const debug = require('debug')('rxjs-mongodb');
const { from, fromEvent, of, merge, using, throwError } = require('rxjs');
const { takeUntil, mergeMap } = require('rxjs/operators');

function createTimer(duration) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration);
  });
}

/**
 * Connect to the MongoDb server
 *
 * @param {MongoClient} mongoClientInstance
 * @param {Number} [minDuration]
 * @return {Observable<MongoClient>}
 */
function connectMongoDb(mongoClientInstance, minDuration = 5000) {
  return using(
    () => {
      debug('connecting');

      const connectPromise = mongoClientInstance.connect();

      const timerPromise = connectPromise
        .catch(() => {})
        .then(() => createTimer(minDuration));

      return {
        connectPromise,
        unsubscribe() {
          debug('unsubscribe');

          connectPromise
            .then(client => timerPromise.then(() => client.close(false)))
            .then(() => {
              debug('connection closed');
            })
            .catch((err) => {
              debug(`caught an error ${err.name}: ${err.message}`);
            });
        }
      };
    },
    ({ connectPromise }) => {
      return from(connectPromise)
        .pipe(
          mergeMap(client => {
            debug('connected');

            const client$ = of(client);
            const close$ = fromEvent(client, 'close');
            const error$ = fromEvent(client, 'error')
              .pipe(
                mergeMap(err => throwError(err))
              );

            return merge(client$, error$)
              .pipe(
                takeUntil(close$)
              );
          })
        );
    }
  );
}

module.exports = connectMongoDb;
