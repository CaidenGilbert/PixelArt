
INSERT INTO users
  (username, password)
VALUES
  ('admin', 'admin');

Insert INTO artwork
  (artwork_name, properties)
VALUES
  ('painting_name', '{"size": "720", "artArray": ["...","...","...","...."]}');

INSERT INTO users_to_artwork
  (username_id, artwork_id)
VALUES
  ('admin', 'painting_name');