import { chosen_color } from "./color_utils.js";
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
    
    // Add event listeners to pixels
    const pixels = document.querySelectorAll('.pixel');
    for (const pixel of pixels) {
        pixel.addEventListener('click', function() {
            const row = Number.parseInt(this.getAttribute('data-row'));
            const col = Number.parseInt(this.getAttribute('data-col'));
            
            if (canvasData[row][col] === 0) {
                canvasData[row][col] = 1;
            }
            
            // console.log(chosen_color);
            this.style.backgroundColor = chosen_color;
            this.style.borderColor = chosen_color;
        });
    };
    
    // Clear button functionality
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            for (const pixel of pixels) {
                pixel.removeAttribute('style');
            };
            
            // Reset canvas data
            for (let i = 0; i < canvasHeight; i++) {
                for (let j = 0; j < canvasWidth; j++) {
                    canvasData[i][j] = 0;
                }
            }
        });
    }
    
    // Save button functionality
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Create a representation of the pixel art
            let artString = '';
            for (let i = 0; i < canvasHeight; i++) {
                for (let j = 0; j < canvasWidth; j++) {
                    artString += canvasData[i][j] ? '■' : '□';
                }
                artString += '\n';
            }
            
            // Output to console for now
            console.log('Your pixel art:');
            console.log(artString);
            
            // For a real implementation, you might want to convert this to an image
            // or save it to local storage/server
            alert('Pixel art saved to console!');
        });
    }

    const artwork_name = document.getElementById('artwork_name').value;
    if (artwork_name) {
      axios.get('/load_canvas')
        .then( (res) => {
          const artArray = res.data.properties.artArray;
          const num_drawn_pixels = artArray.length;

          for (let i = 0; i < num_drawn_pixels; i++) {
            const x = artArray[i].position[0];
            const y = artArray[i].position[1];

            const pixel = document.querySelector(`[data-row="${y}"][data-col="${x}"]`);
            // console.log(x, y, pixel);

            pixel.style.backgroundColor = artArray[i].color;
            pixel.style.borderColor = artArray[i].color;
          }
        })
        .catch( (err) => {
          console.log(err);
        });
    }
});
