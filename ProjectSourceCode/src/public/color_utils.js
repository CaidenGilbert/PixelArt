/*
  formula taken from https://www.rapidtables.com/convert/color/hsv-to-rgb.html 
*/
export function hsvToRGB(hue, saturation, value) {
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

export function changeHue(self, context) {
  console.log(this);
  console.log(context);
  let color = {r: 0, g: 0, b: 0};
  [color.r, color.g, color.b] = hsvToRGB(this.value, 1, 1);
  context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b})`;
  context.fillRect(0, 0, 200, 200);
}
