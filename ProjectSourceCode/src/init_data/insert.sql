
INSERT INTO users
  (username, password)
VALUES
  ('admin', '$2a$10$9LX3mzKOvwFe/y8lKtpceOUEes37SQKzrmNIGZisS6qmamVv1aTfC');

Insert INTO artwork
  (artwork_name, properties)
VALUES
  ('painting_name', '{"size": "720", "artArray": ["...","...","...","...."]}');

INSERT INTO users_to_artwork
  (username_id, artwork_id)
VALUES
  ('admin', 'painting_name');