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

    function SaveArt() {
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

    window.addEventListener("beforeunload", () => {
        SaveArt();
    });
    //const artworkId = document.querySelector('.container').dataset.artworkId;
    
    
   


const upldBtn = document.getElementById('upload-btn');
if (upldBtn) {
    console.log("here");
    upldBtn.addEventListener("click", async () => {
        console.log("Script loaded, upload button found:", upldBtn);

    const artworkId = sessionStorage.getItem("artwork_id"); // or wherever you store it
   // const artworkName = sessionStorage.getItem("artwork_name");
  //  const properties = JSON.stringify(currentCanvas); // your canvas object
   // const thumbnail = currentThumbnail; // base64 string, for example
  
    try {
      // Step 1: Check if artwork_id already exists
      console.log("here");
      const checkRes = await fetch(`/check_artwork/${artworkId}`);
      const checkData = await checkRes.json();
  
      if (checkData.exists) {
        const confirmed = confirm("Artwork already uploaded. Do you want to update it?");
        if (!confirmed) return;
  
        // Step 2: Update existing artwork
        const updateRes = await fetch("/update_uploaded_artwork", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artwork_id: artworkId, }),
        });
  
        if (updateRes.ok) alert("Artwork updated!");
        else alert("Failed to update artwork.");
      } else {
        // Step 3: Create new artwork
        const confirmUpload = confirm("⚠️ This will permanently upload this iteration to the global gallery. Do you want to proceed?");
        
        if (!confirmUpload) {
            return; // Exit if the user cancels
        }

        // Optional: Gather the artwork data here
        const artworkName = prompt("Please name your artwork:");

        if (!artworkName) {
            alert("Artwork name is required to upload.");
            return;
        }
        const createRes = await fetch("/uploaded_canvas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artwork_name: artworkName, }),
        });

        const createData = await createRes.json();

console.log("Returned artwork_id:", createData.artwork_id);


if (createData.success) {
  const artworkId = createData.artwork_id;
  console.log("Artwork uploaded with ID:", artworkId);

  // You can store this in a global var or localStorage if needed
  localStorage.setItem("artwork_id", artworkId);
}
  
        if (createRes.ok) alert("Artwork uploaded!");
        else alert("Failed to upload artwork.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  });
} 
// This part was outside the DOMContentLoaded block — moved it in here
    const artwork_name = document.getElementById('artwork_name').value;
    if (artwork_name) {
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