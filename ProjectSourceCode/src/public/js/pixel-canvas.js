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

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const artwork_name = document.getElementById('artwork_name').value || "Untitled";
            const num_pixels = pixels.length;
            const artwork_data = [];

            for (let i = 0; i < num_pixels; i++) {
                if (pixels[i].style.backgroundColor) {
                    artwork_data.push({
                        position: i,
                        color: rgbToHex(pixels[i].style.backgroundColor)
                    });
                }
            }

            axios.post('/save_canvas', {
                name: `${artwork_name}`,
                properties: {
                    size: num_pixels,
                    artArray: artwork_data
                }
            });
        });
    }
});
