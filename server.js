var app = require('koa')();
var router = require('koa-router')();

console.log('starting...');

router
  .get('/', function *(next) {
    this.body = 'Hello World';
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 3000);
console.log('started!');
