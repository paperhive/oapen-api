'use strict';
const app = require('koa')();
const co = require('co');
const router = require('koa-router')();

const database = require('./database');

co(function *main() {
  const db = yield database.init();

  router
    .get('/', function *getRecords() {
      this.body = { status: 'running' }
    })

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
      const id = parseInt(this.params.id, 10);
      if (!Number.isInteger(id) || id < 0 || id > (Math.pow(2, 31) - 1)) {
        this.body = {
          code: '422',
          message: 'Unprocessable Entity',
        };
        this.status = 422;
        return;
      }
      const resp = yield db.query(selectData, [this.params.id]);

      if (resp.rows.length === 0) {
        this.body = {
          code: '404',
          message: 'Not Found',
        };
        this.status = 404;
        return;
      }
      this.body = resp.rows[0];
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
