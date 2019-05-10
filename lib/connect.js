const debug = require('debug')('rxjs-mongodb');
const { from, fromEvent, of, merge, using, throwError } = require('rxjs');
const { takeUntil, mergeMap } = require('rxjs/operators');
const { MongoClient } = require('mongodb');

/**
 * Connect to the MongoDb server
 *
 * @param {String} url
 * @param {Object} [options]
 * @return {Observable<MongoClient>}
 */
function connectMongoDb(url, options) {
  return using(
    () => {
      debug('connecting');

      const connectPromise = MongoClient.connect(url, options);

      return {
        connectPromise,
        unsubscribe() {
          debug('unsubscribe');

          connectPromise
            .then(client => client.close(false))
            .then(() => {
              debug('done');
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
