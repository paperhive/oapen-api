const app = require('koa')();
const bluebird = require('bluebird');
const co = require('co');
const router = require('koa-router')();
const pg = require('pg');
pg.defaults.ssl = true;

co(function *main() {
  const connect = bluebird.promisify(pg.connect, {context: pg});
  const client = yield connect(process.env.DATABASE_URL);
  const query = bluebird.promisify(client.query, {context: client});

  console.log('Database connection ready');

  router.get('/', function *(next) {
    const data = yield query('SELECT * FROM oapen_data;')
    this.body = data.rows;
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
