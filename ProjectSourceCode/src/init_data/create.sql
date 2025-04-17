CREATE TABLE users(username VARCHAR(50) Primary Key, password VARCHAR(60) NOT NUll);
CREATE Table artwork(id serial primary key,artwork_name VARCHAR(50), properties JSON);

DROP TABLE IF EXISTS users_to_artwork;

CREATE TABLE users_to_artwork (
  username_id VARCHAR(50) NOT NULL REFERENCES users (username),
  artwork_id int NOT NULL REFERENCES artwork (id)
);