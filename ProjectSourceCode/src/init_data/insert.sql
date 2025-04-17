
INSERT INTO users
  (username, password)
VALUES
  ('admin', '$2a$10$9LX3mzKOvwFe/y8lKtpceOUEes37SQKzrmNIGZisS6qmamVv1aTfC');

Insert INTO artwork
  (artwork_name, properties)
VALUES
  ('painting_name', '{"width":32, "height":32, "artArray": [{"position": [0, 0], "color":"#ff0000"},{"position": [0, 31], "color":"#ff0000"},{"position": [31, 0], "color":"#ff0000"},{"position": [31, 31], "color":"#ff0000"}]}'),
  ('test', '{"width": 32, "height":32, "artArray": [{"position": [0, 0], "color":"#000000"}]}');

INSERT INTO users_to_artwork
  (username, artwork)
VALUES
  ('admin', 1), 
  ('admin', 2);
