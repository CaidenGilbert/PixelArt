document.addEventListener('DOMContentLoaded', function() {
    // Canvas dimensions
    const canvasWidth = 32;
    const canvasHeight = 32;
    
    // Initialize the canvas data
    let canvasData = [];
    for (let i = 0; i < canvasHeight; i++) {
        let row = [];
        for (let j = 0; j < canvasWidth; j++) {
            row.push(0); // 0 means white/empty, 1 means black/filled
        }
        canvasData.push(row);
    }
    
    // Add event listeners to pixels
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.addEventListener('click', function() {
            const row = parseInt(this.getAttribute('data-row'));
            const col = parseInt(this.getAttribute('data-col'));
            
            // Toggle the pixel state
            if (this.classList.contains('filled')) {
                this.classList.remove('filled');
                canvasData[row][col] = 0;
            } else {
                this.classList.add('filled');
                canvasData[row][col] = 1;
            }
        });
    });
    
    // Clear button functionality
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            pixels.forEach(pixel => {
                pixel.classList.remove('filled');
            });
            
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
        saveBtn.addEventListener('click', function() {
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
});