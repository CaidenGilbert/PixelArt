const preview_canvas = document.getElementById("color_preview");
let preview_context = preview_canvas.getContext("2d");
const hue_slider_canvas = document.getElementById("hue_slider");
let hue_slider_context = hue_slider_canvas.getContext("2d");

drawInitialCanvases();
addClickEvent();

function drawInitialCanvases() {
  preview_context.fillStyle = "black";
  preview_context.fillRect(0, 0, preview_canvas.width, preview_canvas.height);

  let gradient = hue_slider_context.createLinearGradient(0, 0, hue_slider_canvas.width, 0);

  for (let i = 0; i <= 360; i++) {
      let [r, g, b] = hsvToRGB(i, 1, 1);
      gradient.addColorStop(i / 360, `rgba(${r}, ${g}, ${b}, 1)`);
  }

  hue_slider_context.fillStyle = gradient;
  hue_slider_context.fillRect(0, 0, hue_slider_canvas.width, hue_slider_canvas.height);
}

function addClickEvent() {
  hue_slider_canvas.addEventListener('click', function(event) {
    // get mouse position relative to canvas
    const rect = this.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / (rect.right - rect.left) * this.width;

    // convert x pos to hue (in degrees)
    const hue = (pos / this.width) * 360;

    let [r, g, b] = hsvToRGB(hue, 1, 1);
    preview_context.fillStyle = `rgba(${r}, ${g}, ${b})`;
    preview_context.fillRect(0, 0, preview_canvas.width, preview_canvas.height);
  });
}

/*
  formula taken from https://www.rapidtables.com/convert/color/hsv-to-rgb.html 
*/
function hsvToRGB(hue, saturation, value) {
  const C = saturation * value;
  const X = C * (1 - Math.abs( ( (hue / 60) % 2) - 1) ); 
  const m = value - C;
  let r;
  let g;
  let b;
  
  if (hue >= 0 && hue < 60) {
    r = C;
    g = X;
    b = 0;
  }
  else if (hue < 120) {
    r = X;
    g = C;
    b = 0;
  }
  else if (hue < 180) {
    r = 0;
    g = C;
    b = X;
  }
  else if (hue < 240) {
    r = 0;
    g = X;
    b = C;
  }
  else if (hue < 300) {
    r = X;
    g = 0;
    b = C;
  }
  else if (hue <= 360) {
    r = C;
    g = 0;
    b = X;
  }
  else {
    console.log("Invalid Hue");
  }

  return [255 * (r + m), 255 * (g + m), 255 * (b + m)]; 
}


