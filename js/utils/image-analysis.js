async function createCanvasFromImage(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create an image element
    const img = new Image();

    // Convert blob/file to URL if needed
    const imageUrl = imageData instanceof Blob ?
        URL.createObjectURL(imageData) :
        imageData;

    // Wait for image to load
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
    });

    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0);

    // Clean up URL if we created one
    if (imageData instanceof Blob) {
        URL.revokeObjectURL(imageUrl);
    }

    return canvas;
}

async function analyzeBrightness(imageData) {
    const canvas = await createCanvasFromImage(imageData);
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Get image data
    const imageDataObj = ctx.getImageData(0, 0, width, height);
    const data = imageDataObj.data;

    // Convert to grayscale and create brightness array
    const imgArray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        // Convert RGB to grayscale using luminosity method
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        imgArray[i/4] = gray;
    }

    // Calculate the position where mosque architecture typically starts
    const mosqueStartY = Math.floor(height * 0.7);

    // Create initial binary mask with brightness threshold
    const brightnessThreshold = 180;
    const brightMask = new Uint8Array(imgArray.map(value => value > brightnessThreshold ? 1 : 0));

    // Create a region of interest mask
    const roiMask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            roiMask[y * width + x] = y < mosqueStartY ? 1 : 0;
        }
    }

    // Combine masks
    const finalMask = new Uint8Array(width * height);
    for (let i = 0; i < finalMask.length; i++) {
        finalMask[i] = brightMask[i] & roiMask[i];
    }

    // Create kernel for morphological operations
    const kernel = [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1]
    ];

    // Apply dilation and erosion
    let processedMask = binaryDilation(finalMask, kernel, width, height, 2);
    processedMask = binaryErosion(processedMask, kernel, width, height, 2);

    // Create result canvas with mask
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultCtx = resultCanvas.getContext('2d');
    const resultImageData = resultCtx.createImageData(width, height);

    for (let i = 0; i < processedMask.length; i++) {
        const idx = i * 4;
        const value = processedMask[i] ? 255 : 0;
        resultImageData.data[idx] = value;     // R
        resultImageData.data[idx + 1] = value; // G
        resultImageData.data[idx + 2] = value; // B
        resultImageData.data[idx + 3] = 255;   // A
    }

    resultCtx.putImageData(resultImageData, 0, 0);

    // Convert canvas to blob
    const maskBlob = await new Promise(resolve => {
        resultCanvas.toBlob(resolve, 'image/png');
    });

    return {
        processedMask,
        maskBlob
    };
}

// Binary dilation and erosion functions remain the same as they work with arrays
function binaryDilation(mask, kernel, width, height, iterations) {
    let result = new Uint8Array(mask);

    for (let iter = 0; iter < iterations; iter++) {
        const temp = new Uint8Array(result);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (result[y * width + x]) {
                    const kernelRadius = Math.floor(kernel.length / 2);
                    for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                            const ny = y + ky;
                            const nx = x + kx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                temp[ny * width + nx] = 1;
                            }
                        }
                    }
                }
            }
        }
        result = temp;
    }

    return result;
}

function binaryErosion(mask, kernel, width, height, iterations) {
    let result = new Uint8Array(mask);

    for (let iter = 0; iter < iterations; iter++) {
        const temp = new Uint8Array(result);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let keep = true;
                const kernelRadius = Math.floor(kernel.length / 2);

                if (result[y * width + x]) {
                    for (let ky = -kernelRadius; ky <= kernelRadius && keep; ky++) {
                        for (let kx = -kernelRadius; kx <= kernelRadius && keep; kx++) {
                            const ny = y + ky;
                            const nx = x + kx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                if (!result[ny * width + nx]) {
                                    keep = false;
                                }
                            }
                        }
                    }
                }
                temp[y * width + x] = keep ? 1 : 0;
            }
        }
        result = temp;
    }

    return result;
}

function findPotentialTextArea(mask) {
    const width = Math.sqrt(mask.length);
    const height = width;

    // Calculate margins based on image proportions
    const topMargin = Math.floor(height * 0.05);
    const bottomMargin = Math.floor(height * 0.85);
    const sideMargin = Math.floor(width * 0.15);

    // Create the boundary box
    const left = sideMargin;
    const right = width - sideMargin;
    const top = topMargin;
    const bottom = bottomMargin;

    return [left, top, right, bottom];
}

async function visualizeTextArea(imageData, boundaries) {
    const canvas = await createCanvasFromImage(imageData);
    const ctx = canvas.getContext('2d');

    const [left, top, right, bottom] = boundaries;

    // Draw rectangle with red color
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, right - left, bottom - top);

    // Convert canvas to blob
    const resultBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
    });

    return resultBlob;
}

async function createTextAreaMask(
    imageData,
    boundaries,
    minBrightnessThreshold = 180,
    minClearAreaPercentage = 0.8
) {
    const canvas = await createCanvasFromImage(imageData);
    const ctx = canvas.getContext('2d');
    const [left, top, right, bottom] = boundaries;

    // Get grayscale image data for the text area
    const imageDataObj = ctx.getImageData(left, top, right - left, bottom - top);
    const data = imageDataObj.data;

    // Calculate clear area percentage
    let clearPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        totalPixels++;
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        if (gray > minBrightnessThreshold) {
            clearPixels++;
        }
    }

    const clearPercentage = clearPixels / totalPixels;
    const needsClearing = clearPercentage < minClearAreaPercentage;

    if (!needsClearing) {
        return [false, null];
    }

    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Fill with black
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Clear text area
    maskCtx.clearRect(left, top, right - left, bottom - top);

    // Convert to blob
    const maskBlob = await new Promise(resolve => {
        maskCanvas.toBlob(resolve, 'image/png');
    });

    return [true, maskBlob];
}

export {
    analyzeBrightness,
    findPotentialTextArea,
    visualizeTextArea,
    createTextAreaMask
};