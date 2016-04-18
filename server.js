'use strict';
const app = require('koa')();
const bluebird = require('bluebird');
const co = require('co');
const router = require('koa-router')();
const pg = require('pg');
const request = require('request');
const parseString = require('xml2js').parseString;
const _ = require('lodash');

// enable SSL if DATABASE_SSL is not false
pg.defaults.ssl = !(process.env.DATABASE_SSL === 'false');

co(function *main() {
  const connect = bluebird.promisify(pg.connect, {context: pg});
  const client = yield connect(process.env.DATABASE_URL);
  const query = bluebird.promisify(client.query, {context: client});

  console.log('Database connection ready');

  router
    .get('/', function *(next) {
      const data = yield query('SELECT * FROM oapen_data;');
      this.body = data.rows;
    })

    .post('/import', function *(next) {
      // download data via npm request
      const response = yield bluebird.promisify(request)('http://localhost:8000/oapen.onix3.0.xml');
      const xml = response.body;

      // parse data via xml2js
      const parsedData = yield bluebird.promisify(parseString)(xml);
      const results = parsedData.ONIXMessage;

      // upsert
      for (let product of results.Product) {
        // check if id is already in db
        let selectQuery = 'SELECT data FROM oapen_data WHERE id = $1::int LIMIT 1';
        let res = yield query(selectQuery, [product.RecordReference[0]]);
        let row = res.rows[0].data;

        // id is already in db
        if (row) {
          // compare JSON
          let equal = _.isEqual(row, product);
          if (!equal) {
            // update record
            let updateQuery = 'UPDATE oapen_data SET timestamp=NOW(),data=$1 WHERE id=$2::int';
            yield query(updateQuery, [product, product.RecordReference[0]]);
          }
        // id not yet in db
        } else {
          // add data to db
          let insertQuery = 'INSERT INTO oapen_data(id, timestamp, data) VALUES($1::int, NOW(), $2)';
          yield query(insertQuery, [product.RecordReference[0], product]);
        }
      }
    });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const port = process.env.PORT || 3000;
  const server = app.listen(port);
  console.log('App now running on port', port);

}).catch(error => {
  console.error(error);
  process.exit(1);
});
