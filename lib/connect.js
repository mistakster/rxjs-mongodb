const debug = require('debug')('rxjs-mongodb');
const { from, fromEvent, merge, using, NEVER } = require('rxjs');
const { tap, takeUntil, flatMap } = require('rxjs/operators');
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

      const client = MongoClient.connect(url, options);

      return {
        client,
        unsubscribe() {
          debug('unsubscribing');
          client
            .then((c) => c.close(false))
            .catch((err) => {
              debug(`caught an error ${err.name}: ${err.message}`);
            })
            .then(() => debug('done'));
        }
      };
    },
    ({ client }) => {
      const stop$ = from(client)
        .pipe(
          tap(() => debug('connected')),
          flatMap(c => fromEvent(c, 'close', () => true)),
          tap(() => debug('close connection'))
        );

      return merge(NEVER, from(client))
        .pipe(
          takeUntil(stop$)
        );
    }
  );
}

module.exports = connectMongoDb;
