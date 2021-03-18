const express = require('express');
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'reviews',
  port: 5432,
});

client.connect();

const app = express();
const port = 3000;
const path = require('path');
const morgan = require('morgan');

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/reviews', (req, res) => {
  const { product_id, count, sort } = req.query;
  const sql = `
    select * from reviews where product_id = ${product_id} limit ${count}
  `;

  client.query(sql)
    .then((results) => res.send(results.rows))
    .catch((err) => console.log(err));
});

app.get('/api/reviews/meta', (req, res) => {
  const { product_id } = req.query;
  const response = {
    product_id: product_id
  };

  const sql = `
    SELECT value FROM characteristic_reviews JOIN reviews USING(review_id) WHERE product_id = ${product_id};
    SELECT recommend FROM reviews where product_id = ${product_id};
  `;

  client.query(sql)
    .then((results) => res.send(results.rows))
    .catch((err) => console.log(err));
});

app.put('/api/reviews/:review_id/helpful', (req, res) => {

});

app.post('/api/reviews', (req, res) => {
  let {} = req.body;
});

app.put('/api/reviews/:review_id/report', (req, res) => {
  const {} = req.body;
});

app.listen(port, () => {
  console.log(`Listening at PORT ${port}`);
});
