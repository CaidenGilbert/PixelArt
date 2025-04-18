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
    let artName = '';
    // Add event listeners to pixels
    const pixels = document.querySelectorAll('.pixel');
    for (const pixel of pixels) {
        pixel.addEventListener('click', function() {
            const row = Number.parseInt(this.getAttribute('data-row')); //getting length pf row
            const col = Number.parseInt(this.getAttribute('data-col')); //getting length of column
            console.log("Row: "+row + " Column: "+ col + " Color: "+ chosen_color);
            canvasData[row][col] = chosen_color;
            this.style.backgroundColor = chosen_color;
            this.style.borderColor = chosen_color;

            socket.emit('update', row, col, chosen_color, canvasHeight, canvasWidth, this);  // could emit row, col, chosen-color, which avoid problems of emiting 2d array
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
                    console.log("RESETING");
                    canvasData[i][j] = 0;
                }
            }
        });
    }
    function SaveArt()
    {
      axios.post('/save_canvas', {
          name: `${artName}`,
          properties: {
              width: canvasWidth,
              height: canvasHeight,
              artArray: canvasData
          }
        });
        return true;
    }
    // Save button functionality
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            SaveArt();
        });
    }

    socket.on('update', function(row, col, chosen_color, pixel) {
      const pixels = document.querySelectorAll('.pixel');
      for (const pixel of pixels) {
          if(pixel.getAttribute('data-row') == row && pixel.getAttribute('data-col') == col)
            {
                pixel.style.backgroundColor = chosen_color;
                pixel.style.borderColor = chosen_color;
                canvasData[row][col] = chosen_color;
            }
      };
    });

    socket.on('update all', function(historyArray) {
      
      for(let row = 0; row < historyArray.length; row++)
      {
        for(let col = 0; col < historyArray[row].length; col++)
        {
            const pixels = document.querySelectorAll('.pixel');
            for (const pixel of pixels) {
                if(pixel.getAttribute('data-row') == row && pixel.getAttribute('data-col') == col)
                  {
                      pixel.style.backgroundColor = historyArray[row][col];
                      pixel.style.borderColor = historyArray[row][col];
                  }
            };
        }
      }
    });

    let inputs = document.getElementsByName("artworkName")
    for (let i = 0; i < inputs.length; i++) {
    inputs[i].onkeyup = function () {
        if(this.value.match(/.+/))
        {
            console.log(this.value);
            artName = this.value;
        }
    };
    }
    window.addEventListener("beforeunload", () => {SaveArt()});
});