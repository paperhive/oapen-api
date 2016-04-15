const app = require('koa')();
const bluebird = require('bluebird');
const co = require('co');
const router = require('koa-router')();
const pg = require('pg');
const request = require('request');
const parseString = require('xml2js').parseString;

pg.defaults.ssl = true;

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

      const response = yield bluebird.promisify(request)('http://www.xmlfiles.com/examples/note.xml');
      const xml = response.body;

      // parse data via xml2js
      const result = yield bluebird.promisify(parseString)(xml);
      this.body = result;


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
