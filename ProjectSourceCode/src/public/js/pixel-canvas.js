import { chosen_color, rgbToHex } from "./color_utils.js";

document.addEventListener('DOMContentLoaded', () => {
    // Canvas dimensions
    const canvasWidth = 32;
    const canvasHeight = 32;

    // Initialize the canvas data
    const canvasData = [];
    for (let i = 0; i < canvasHeight; i++) {
        const row = [];
        for (let j = 0; j < canvasWidth; j++) {
            row.push(0); // 0 means white/empty, 1 means black/filled
        }
        canvasData.push(row);
    }

    let artName = '';

    // Add event listeners to pixels
    const pixels = document.querySelectorAll('.pixel');
    for (const pixel of pixels) {
        pixel.addEventListener('click', function() {
            const row = Number.parseInt(this.getAttribute('data-row'));
            const col = Number.parseInt(this.getAttribute('data-col'));
            console.log("Row: " + row + " Column: " + col + " Color: " + chosen_color);
            canvasData[row][col] = chosen_color;
            this.style.backgroundColor = chosen_color;
            this.style.borderColor = chosen_color;

            socket.emit('update', row, col, chosen_color, canvasHeight, canvasWidth, this);
        });
    }

    // Clear button functionality
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            for (const pixel of pixels) {
                pixel.removeAttribute('style');
            }

            // Reset canvas data
            for (let i = 0; i < canvasHeight; i++) {
                for (let j = 0; j < canvasWidth; j++) {
                    console.log("RESETTING");
                    canvasData[i][j] = 0;
                }
            }
        });
    }

    function SaveArt()
    {
        //*******************************************************experimental*********************** */
        const artwork_data = [];

        for (let i = 0; i < canvasHeight; i++) {
            for (let j = 0; j < canvasWidth; j++) {
              if (canvasData[i][j]) {
                  artwork_data.push({
                      position: [j, i],
                      color: rgbToHex(pixels[j + (i * canvasWidth)].style.backgroundColor)
                  });
              }
            }
        }
        //*******************************************************experimental*********************** */
      axios.post('/save_canvas', {
          name: `${artName}`,
          properties: {
              width: canvasWidth,
              height: canvasHeight,
              artArray: artwork_data
          }
        });
        return true;
    }

    // Save button functionality
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const node = document.getElementById('canvas-container');
            htmlToImage.toPng(node, { canvasWidth: 200, canvasHeight: 200 })
                .then((dataURL) => {
                    axios.post('/save_thumbnail', {
                        image: dataURL,
                    })
                    .then((res) => {
                        console.log(res);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                })
                .catch((err) => {
                    console.log(err);
                });

            SaveArt();
        });
    }

    socket.on('update', function(row, col, chosen_color, pixel) {
        const pixels = document.querySelectorAll('.pixel');
        for (const pixel of pixels) {
            if (pixel.getAttribute('data-row') == row && pixel.getAttribute('data-col') == col) {
                pixel.style.backgroundColor = chosen_color;
                pixel.style.borderColor = chosen_color;
                canvasData[row][col] = chosen_color;
            }
        }
    });

    socket.on('update all', function(historyArray) {
        for (let row = 0; row < historyArray.length; row++) {
            for (let col = 0; col < historyArray[row].length; col++) {
                const pixels = document.querySelectorAll('.pixel');
                for (const pixel of pixels) {
                    if (pixel.getAttribute('data-row') == row && pixel.getAttribute('data-col') == col) {
                        pixel.style.backgroundColor = historyArray[row][col];
                        pixel.style.borderColor = historyArray[row][col];
                    }
                }
            }
        }
    });

    let inputs = document.getElementsByName("artworkName");
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].onkeyup = function () {
            if (this.value.match(/.+/)) {
                console.log(this.value);
                artName = this.value;
            }
        };
    }

    window.addEventListener("beforeunload", async() => {
        console.log("SAVING");
        SaveArt();
    });

    // This part was outside the DOMContentLoaded block — moved it in here
    if (artName) {
        axios.get('/load_canvas')
            .then((res) => {
                const artArray = res.data.properties.artArray;
                const num_drawn_pixels = artArray.length;

                for (let i = 0; i < num_drawn_pixels; i++) {
                    const x = artArray[i].position[0];
                    const y = artArray[i].position[1];

                    const pixel = document.querySelector(`[data-row="${y}"][data-col="${x}"]`);
                    if (pixel) {
                        pixel.style.backgroundColor = artArray[i].color;
                        pixel.style.borderColor = artArray[i].color;
                    }
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
});
