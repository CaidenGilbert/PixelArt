const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const color_utils = require('./color_utils.js');

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: `${__dirname}/views/layouts`,
  partialsDir: `${__dirname}/views/partials`,
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static('public'));

let color = {r: 0, g: 0, b: 0, a: 1};

app.get('/', (req, res) => {
  res.render('pages/color_picker.hbs', {
    script: `
      let canvas = document.getElementById("color_picker");
      let context = canvas.getContext("2d");

      context.fillStyle = "rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})";
      context.fillRect(0, 0, 200, 200);
    `,
  });
});

app.post('/changeHue', (req, res) => {
  [ color.r, color.g, color.b ] = color_utils.hsvToRGB(req.body.hue, 1, 1);
  res.redirect('/');
});

app.listen(3000);
console.log('Server is listening on port 3000');
