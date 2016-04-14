var app = require('koa')();
var router = require('koa-router')();
var pg = require('pg');
pg.defaults.ssl = true;

pg.connect(process.env.DATABASE_URL, function(error, client) {
  if(error) throw error;

  console.log('Database connection ready');

  router
    .get('/', function *(next) {
      this.body = 'Hello World';
    });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const port = process.env.PORT || 3000;
  var server = app.listen(port);
  console.log('App now running on port', port);
});
