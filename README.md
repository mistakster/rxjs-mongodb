# rxjs-mongodb

It's the proper way to get a MongoDB Client as an Observable. 

## Motivation

It’s quite tricky to convert a connection to a MongoDB server to an Observable. A stream should meet the following requirements:

1. It must emit an event with the instance only once.
2. It must emit any errors.
3. It must wait until the disconnection.

Also, the client must disconnect from the server if no subscription currently exists.

## Usage

```javascript

const client$ = connectMongoDb(MONGODB_URL, MONGODB_OPTS);

const data$ = client$.pipe(
  map(client => client.db(MONGODB_DATABASE)),
  map(db => db.collection('items')),
  map(items => items.find({ value: { $gte: 0.5 } })),
  map(cursor => cursor.transformStream()),
  mergeMap(streamToRx)
);

data$.subscribe(datum => {
  console.log(datum._id);
});
```

## License

MIT
