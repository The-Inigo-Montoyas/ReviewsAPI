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
const port = 3003;
const path = require('path');
const morgan = require('morgan');

app.use(express.json());
app.use(morgan('dev'));

app.get('/reviews/:id/:sort', (req, res) => {
  const { id, sort } = req.params;
  let sql;
  if (sort === 'newest') {
    sql = `
      select * from reviews 
      where product_id = ($1) 
      and reported = false 
      order by date desc limit 10;
    `;
  } else if (sort === 'helpful') {
    sql = `
      select * from reviews 
      where product_id = ($1) 
      and reported = false 
      order by helpfulness desc limit 10;
    `;
  } else if (sort === 'relevant') {
    sql = `
      select * from reviews
      where product_id = ($1) 
      and reported = false 
      order by helpfulness desc, date desc limit 10;
    `;
  }

  const response = {};
  client.query(sql, [id])
    .then((results) => {
      response.results = results.rows;
      let sql2, reviewId, photosArray;
      const promiseArray = [];
      for (let i = 0; i < response.results.length; i++) {
        reviewId = response.results[i].review_id;
        sql2 = `
          select url from photos
          where review_id = ${reviewId}
        `;
        const promise = client.query(sql2)
          .then((photos) => {
            if (photos.rows === null) {
              photosArray = [];
            } else {
              photosArray = photos.rows.map((photo) => photo.url);
            }
            response.results[i].photos = photosArray;
          })
          .catch((err) => console.log(err));
          promiseArray.push(promise);
        }
        return Promise.all(promiseArray);
      })
      .then(() => res.send(response))
      .catch((err) => console.log(err));

});

app.get('/api/reviews/meta/:id', (req, res) => {
  const { id } = req.params;
  // res.send(id);
  const response = {
    product_id: id.toString(),
    ratings: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    },
    recommended: {
      false: 0,
      true: 0,
    },
    characteristics: {},
  };

  const sql = `
    SELECT value FROM characteristic_reviews 
    JOIN reviews 
    USING(review_id)
    WHERE product_id = ${id};

    SELECT recommend 
    FROM reviews 
    WHERE product_id = ${id};

    SELECT * 
    FROM characteristics 
    JOIN characteristic_reviews 
    USING(characteristic_id) 
    WHERE product_id = ${id};
  `;

  client.query(sql)
    .then((results) => {
      console.log(results);
      for (let i = 0; i < results[0].rows.length; i++) {
        response.ratings[results[0].rows[i].value] += 1;
      }
      response.ratings['1'] = response.ratings['1'].toString();
      response.ratings['2'] = response.ratings['2'].toString();
      response.ratings['3'] = response.ratings['3'].toString();
      response.ratings['4'] = response.ratings['4'].toString();
      response.ratings['5'] = response.ratings['5'].toString();

      for (let i = 0; i < results[1].rows.length; i++) {
        response.recommended[results[1].rows[i].recommend] += 1;
      }

      response.recommended.false = response.recommended.false.toString();
      response.recommended.true = response.recommended.true.toString();

      let characteristicInfo = results[2].rows;
      let characteristicCounts = {};

      for (let i = 0; i < characteristicInfo.length; i++) {
        if (response.characteristics[characteristicInfo[i].name] === undefined) {
          characteristicCounts[characteristicInfo[i].name] = 1;
          response.characteristics[characteristicInfo[i].name] = {
            id: characteristicInfo[i].characteristic_id,
            value: characteristicInfo[i].value,
          };
        } else {
          characteristicCounts[characteristicInfo[i].name] += 1;
          response.characteristics[characteristicInfo[i].name].value += characteristicInfo[i].value;
        }
      }

      let characteristics = Object.entries(response.characteristics);
      characteristics.forEach((characteristic) => {
        characteristic[1].value = characteristic[1].value / characteristicCounts[characteristic[0]];
        response.characteristics[characteristic[0]].value = characteristic[1].value.toString();
      });

      res.send(response);
    })
    .catch((err) => console.log(err));
});

app.put('/reviews/help', (req, res) => {
  const { body } = req.body;
  const { id } = body;
  let sqlSelect = `
    SELECT helpfulness
    FROM reviews
    WHERE review_id = ($1)
  `;

  let sqlUpdate = `
    UPDATE reviews
    SET helpfulness = ($1)
    WHERE review_id = ($2)
  `;

  client.query(sqlSelect, [id])
    .then((results) => {
      let newHelpful = results.rows[0].helpfulness + 1;
      // console.log(newHelpful);
      client.query(sqlUpdate, [newHelpful, id])
        .then(() => res.send(204))
        .catch(console.log);
    })
    .catch(console.log);
});

app.post('/newReview', (req, res) => {
  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics,
  } = req.body;

  const newCharacteristics = {
    Fit: {
      id: 7,
      value: 4,
    },
  };

  let sqlReviews = `
    INSERT INTO reviews
    (product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
    VALUES (($1), ($2), ($3), ($4), ($5), ($6), ($7), ($8), ($9), ($10), ($11))
  `;

  let review_id;
  let characteristicId;

  const queryArgsReviews = [product_id, rating, new Date().toISOString(), summary, body, recommend, false, name, email, null, 0];

  client.query(sqlReviews, queryArgsReviews)
    .then(() => {
      let sqlReviewId = `
        SELECT review_id from reviews
        WHERE product_id = ($1)
        AND body = ($2);
      `;
      client.query(sqlReviewId, [product_id, body])
        .then((results) => {
          review_id = results.rows[0].review_id;
          photos.forEach((photo) => {
            let sqlPhotos = `
              INSERT INTO photos
              (review_id, url)
              VALUES (($1), ($2))
            `;
            client.query(sqlPhotos, [review_id, photo])
              .then(() => console.log('photo\'s uploaded!'))
              .catch(console.log);
          });
        })
        .then(() => {
          const characteristicArr = Object.entries(newCharacteristics);
          characteristicArr.forEach((characteristic) => {
            const sqlCharacteristics = `
              INSERT INTO characteristics
              (product_id, name)
              VALUES (($1), ($2))
            `;
            client.query(sqlCharacteristics, [product_id, characteristic[0]])
              .then(() => {
                const sqlCharId = `
                  SELECT characteristic_id FROM characteristics WHERE product_id = ($1) AND name = ($2)
                `;

                return client.query(sqlCharId, [product_id, characteristic[0]]);
              })
              .then((result) => {
                const charId = result.rows[0].characteristic_id;
                let sqlCharReviews = `
                  INSERT INTO characteristic_reviews
                  (characteristic_id, review_id, value)
                  VALUES 
                  (($1), 
                  ($2),
                  ($3))
                `;
                client.query(sqlCharReviews, [charId, review_id, characteristic[1].value])
                  .then(() => res.send(201))
                  .catch(console.log);
              })
              .catch(console.log);
          });
        })
        .catch(console.log);
    })
    .catch(console.log);
});

app.put('/reviews/report', (req, res) => {
  console.log('REQBODY', req.body);
  const { body } = req.body;
  const { review_id } = body;
  console.log('REPORT ID', review_id);
  const sql = `
    UPDATE reviews
    SET reported = true
    WHERE review_id = ($1)
  `;

  client.query(sql, [review_id])
    .then(() => res.send(204))
    .catch(console.log);
});

app.listen(port, () => {
  console.log(`Listening at PORT ${port}`);
});
