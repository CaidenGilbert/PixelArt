DROP TABLE IF EXISTS users;
CREATE TABLE users(username VARCHAR(50) Primary Key, password VARCHAR(60) NOT NUll);

DROP TABLE IF EXISTS artwork;
CREATE Table artwork(artwork_name VARCHAR(50) Primary Key, properties JSON);

DROP TABLE IF EXISTS users_to_artwork;
CREATE TABLE users_to_artwork (
  username_id VARCHAR(50) NOT NULL REFERENCES users (username),
  artwork_id VARCHAR(50) NOT NULL REFERENCES artwork (artwork_name)
);
