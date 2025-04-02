const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const color_utils = require('./public/color_utils.js');

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

app.use('/static', express.static( path.join(__dirname, 'public') ));

app.get('/', (req, res) => {
  res.render('pages/color_picker.hbs', {
    script: `
      import { hsvToRGB } from "/static/color_utils.js";
      let canvas = document.getElementById("color_picker");
      let context = canvas.getContext("2d");

      let hue_slider = document.getElementById("hue_slider");
      hue_slider.addEventListener('change', changeHue);
      changeHue.call(hue_slider); 

      function changeHue(self) {
        let color = {r: 0, g: 0, b: 0};
        [color.r, color.g, color.b] = hsvToRGB(this.value, 1, 1);
        context.fillStyle = \`rgba(\${color.r}, \${color.g}, \${color.b})\`;
        context.fillRect(0, 0, 200, 200);
      }
    `,
  });
});

app.listen(3000);
console.log('Server is listening on port 3000');
