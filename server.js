const app = require('koa')();
const bluebird = require('bluebird');
const co = require('co');
const router = require('koa-router')();
const pg = require('pg');
const request = require('request');
const parseString = require('xml2js').parseString;

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
      const results = yield bluebird.promisify(parseString)(xml);
      this.body = results.ONIXMessage.Product[0].RecordReference[0];

      // upsert
      // for (var i in results) {
      //   const row = results[i];
      //   const data = yield query('SELECT 1 FROM oapen_data WHERE id = 1;');
      //   if (!data) {
      //     // insert
      //   }
      // }

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
