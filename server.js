'use strict';
const app = require('koa')();
const bluebird = require('bluebird');
const co = require('co');
const router = require('koa-router')();
const request = require('request');
const parseString = require('xml2js').parseString;
const _ = require('lodash');

const database = require('./database');

co(function *main() {
  const db = yield database.init();

  router
    // returns array of all ids (= RecordReferences)
    .get('/records', function *getRecords() {
      const updatedAfter = this.request.query.updatedAfter;
      const compact = this.request.query.compact === 'true';

      const queryStr = `SELECT ${compact ? 'id, timestamp' : '*'} FROM oapen_data`;
      let data;
      if (updatedAfter) {
        data = yield db.query(`${queryStr} WHERE timestamp >= $1`, [updatedAfter]);
      } else {
        data = yield db.query(queryStr);
      }

      this.body = data.rows;
    })

    // returns object (id, timestamp, data) of record with corresponding id
    .get('/records/:id', function *getRecord() {
      const selectData = 'SELECT * FROM oapen_data WHERE id = $1::int';
      const resp = yield db.query(selectData, [this.params.id]);
      this.body = resp.rows;
    })

    .post('/import', function *postImport() {
      // download data via npm request
      const response = yield bluebird.promisify(request)('http://oapen.org/download?type=export&export=onix3.0');
      const xml = response.body;

      // parse data via xml2js
      const parsedData = yield bluebird.promisify(parseString)(xml);
      const results = parsedData.ONIXMessage;

      // upsert
      for (const product of results.Product) {
        // check if id is already in db
        const selectQuery = 'SELECT data FROM oapen_data WHERE id = $1::int LIMIT 1';
        const res = yield db.query(selectQuery, [product.RecordReference[0]]);
        const row = res.rows;

        // id is already in db
        if (row.length > 0) {
          // compare JSON
          const equal = _.isEqual(row[0].data, product);
          if (!equal) {
            // update record
            const updateQuery = 'UPDATE oapen_data SET timestamp = NOW() AT TIME ZONE \'utc\', data = $1 WHERE id = $2::int';
            yield db.query(updateQuery, [product, product.RecordReference[0]]);
          }
        // id not yet in db
        } else {
          // add data to db
          const insertQuery = 'INSERT INTO oapen_data(id, timestamp, data) VALUES($1::int, NOW() AT TIME ZONE \'utc\', $2)';
          yield db.query(insertQuery, [product.RecordReference[0], product]);
        }
      }
      this.body = {message: 'success'};
    });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log('App now running on port', port);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
