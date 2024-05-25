const express = require('express');
const Tesseract = require('tesseract.js');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const storage = multer.diskStorage({
    destination: 'public/uploads/',  // Store files in the public directory
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Function to set cache control headers for image responses
function setCustomCacheControl(res, path) {
    if (express.static.mime.lookup(path) === 'image/png') {
        // Customize cache-control for PNG images
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
}

// Serve static files with custom cache control
app.use('/output', express.static('public/output', { setHeaders: setCustomCacheControl }));
app.use('/uploads', express.static('public/uploads', { setHeaders: setCustomCacheControl }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('video'), async (req, res) => {
    //const keyframes = req.body.keyframes.split(',').map(time => time.trim());
    const keyframes = req.body.keyframes.split(',').map(time => {
        return new Date(time * 1000).toISOString().substr(11, 8); // Converts seconds to HH:MM:SS format
    });
    const videoPath = req.file.path;
    const videoPublicPath = `/uploads/${req.file.filename}?timestamp=${Date.now()}`;
    const outputPath = 'public/output/';
    let processedImages = [];

    if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath, { recursive: true });
    }

    try {
        await Promise.all(keyframes.map((time, index) => {
            return new Promise((resolve, reject) => {
                const inputImagePath = `${outputPath}keyframe-${index}.png`;
                const outputImagePath = `${outputPath}keyframe-bb-${index}.png`;
                const outputImagePublicPath = `/output/keyframe-bb-${index}.png`;

                ffmpeg(videoPath)
                    .screenshots({
                        timestamps: [time],
                        filename: `keyframe-${index}.png`,
                        folder: outputPath,
                        //size: '800x450'
                    })
                    .on('end', async () => {
                        try {
                            await addBoundingBox(inputImagePath, outputImagePath);
                            processedImages.push(outputImagePublicPath);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    });
            });
        }));
        res.json({ videoUrl: videoPublicPath, images: processedImages });
    } catch (error) {
        console.error("Failed processing images:", error);
        res.status(500).send("Error processing images");
    }
});


async function addBoundingBox(inputPath, outputPath) {
    try {
      // Use sharp to get image dimensions
      const metadata = await sharp(inputPath).metadata();
      const imageWidth = metadata.width;
      const imageHeight = metadata.height;
  
      // Use tesseract.js to detect text and bounding boxes
      const { data: { words } } = await Tesseract.recognize(
        inputPath,
        'eng', // Replace 'eng' with the desired language if needed
            tessedit_char_whitelist='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // Optional: Limit recognized characters
            oem=3,
            psm=11,
        { logger: info => console.log(info) } // Optional: Log Tesseract progress
      );
  
      // Create SVG overlay for each detected word
      const overlayOptions = words.map(word => {
        const { x0, y0, x1, y1 } = word.bbox;
        const svg = `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="blue" stroke-width="2"/></svg>`;
        return {
          input: Buffer.from(svg, 'utf-8'),
          top: 0,
          left: 0,
          blend: 'over'
        };
      });
  
      // Apply overlays using sharp
      await sharp(inputPath)
        .composite(overlayOptions)
        .toFile(outputPath);
  
      console.log('Bounding boxes added successfully!');
    } catch (error) {
      console.error('Error adding bounding boxes:', error);
      throw error; 
    }
  }


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
