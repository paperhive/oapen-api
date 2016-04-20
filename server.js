'use strict';
const app = require('koa')();
const co = require('co');
const router = require('koa-router')();

const database = require('./database');

co(function *main() {
  const db = yield database.init();

  router
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
      const resp = yield db.query(selectData, [this.params.id]);
      this.body = resp.rows;
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
