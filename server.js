var app = require('koa')();
var router = require('koa-router')();
var pg = require('pg');
pg.defaults.ssl = true;

pg.connect(process.env.DATABASE_URL, function(error, client) {
  if(error) throw error;

  console.log('Database connection ready');

  var server = app.listen(process.env.PORT || 3000, function() {
    var port = server.address().port;
    console.log('App now running on port', port);
  });
});

router
  .get('/', function *(next) {
    this.body = 'Hello World';
  });

app
  .use(router.routes())
  .use(router.allowedMethods());
