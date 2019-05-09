const { from, fromEvent, merge, using, NEVER } = require('rxjs');
const { share, takeUntil, flatMap } = require('rxjs/operators');
const { tag } = require('rxjs-spy/operators');
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
      const client = MongoClient.connect(url, options);

      return {
        client,
        unsubscribe() {
          client
            .then((c) => c.close(false))
            .catch(() => {
              // suppress connection error
            });
        }
      };
    },
    ({ client }) => {
      const client$ = from(client)
        .pipe(
          tag('mongodb:client'),
          share()
        );

      const stop$ = client$
        .pipe(
          flatMap(c => fromEvent(c, 'close')),
          tag('mongodb:close')
        );

      return merge(NEVER, client$)
        .pipe(
          takeUntil(stop$)
        );
    }
  );
}

module.exports = connectMongoDb;
