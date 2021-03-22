\c reviews;

CREATE TABLE reviews (
  review_id serial primary key,
  product_id integer,
  rating integer,
  date date,
  summary varchar(1000),
  body varchar(1000),
  recommend boolean,
  reported boolean,
  reviewer_name varchar,
  reviewer_email varchar,
  response varchar,
  helpfulness integer
);

CREATE TABLE characteristics (
  characteristic_id serial primary key,
  product_id integer,
  name varchar
);

CREATE TABLE characteristic_reviews (
  id serial primary key,
  characteristic_id integer references characteristics(characteristic_id),
  review_id integer references reviews(review_id),
  value integer
);


CREATE TABLE photos (
  photo_id serial primary key,
  review_id integer references reviews(review_id),
  url varchar
);

-- copy reviews(review_id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
-- FROM '/Users/jessesmith/Desktop/coding/Galvanize/ReviewsAPI/CSV/reviews.csv'
-- DELIMITER ','
-- CSV HEADER;

-- copy characteristics(characteristic_id, product_id, name)
-- FROM '/Users/jessesmith/Desktop/coding/Galvanize/ReviewsAPI/CSV/characteristics.csv'
-- DELIMITER ','
-- CSV HEADER;

-- copy characteristic_reviews(id, characteristic_id, value)
-- FROM '/Users/jessesmith/Desktop/coding/Galvanize/ReviewsAPI/CSV/characteristic_reviews.csv'
-- DELIMITER ','
-- CSV HEADER;

-- copy photos(photo_id, review_id, url)
-- FROM '/Users/jessesmith/Desktop/coding/Galvanize/ReviewsAPI/CSV/reviews_photos.csv'
-- DELIMITER ','
-- CSV HEADER;