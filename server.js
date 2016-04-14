var app = require('koa')();
var router = require('koa-router')();

router
  .get('/', function *(next) {
    this.body = 'Hello World';
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

// app.listen(3000);
// console.log('listening on port 3000');
