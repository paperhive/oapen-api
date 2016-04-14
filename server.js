var app = require('koa')();
var router = require('koa-router')();
var pg = require('pg');
pg.defaults.ssl = true;

// var db;
//
// pg.connect(process.env.DATABASE_URL, function(error, client) {
//   if(error) throw error;
//
//   // client
//   //   .query('SELECT table_schema,table_name FROM information_schema.tables;')
//   //   .on('row', function(row) {
//   //     console.log(JSON.stringify(row));
//   //   });
//
//   db = database;
//   console.log('Database connection ready');
//
//   var server = app.listen(process.env.PORT || 3000, function() {
//     var port = server.address().port;
//     console.log('App now running on port', port);
//   });
//
// });
//

router
  .get('/', function *(next) {
    this.body = 'Hello World';
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 3000);
