'use strict';
const bluebird = require('bluebird');
const co = require('co');
const pg = require('pg');

// enable SSL if DATABASE_SSL is not false
pg.defaults.ssl = !(process.env.DATABASE_SSL === 'false');

exports.init = co.wrap(function *init() {
  const connect = bluebird.promisify(pg.connect, {context: pg});
  const client = yield connect(process.env.DATABASE_URL);
  console.log('Database connection ready');

  return {
    client,
    query: bluebird.promisify(client.query, {context: client}),
  };
});
