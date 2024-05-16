const express = require('express');
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
                const outputImagePath = `${outputPath}keyframe-${index}.png`;
                const outputImagePublicPath = `/output/keyframe-${index}.png?timestamp=${Date.now()}`;

                ffmpeg(videoPath)
                    .screenshots({
                        timestamps: [time],
                        filename: `keyframe-${index}.png`,
                        folder: outputPath,
                        size: '800x450'
                    })
                    .on('end', async () => {
                        try {
                            await addBoundingBox(outputImagePath, outputImagePath);
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


function addBoundingBox(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        sharp(inputPath)
            .metadata()
            .then(metadata => {
                const imageWidth = metadata.width;
                const imageHeight = metadata.height;
                const form = new FormData();
                form.append('image', fs.createReadStream(inputPath));

                axios.post('http://127.0.0.1:5000/detect_text', form, {
                    headers: {
                        ...form.getHeaders()
                    }
                })
                .then(response => {
                    const boxes = response.data.boxes;
                    let overlayOptions = boxes.map(box => {
                        const svg = `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="blue" stroke-width="2"/></svg>`;
                        return {
                            input: Buffer.from(svg, 'utf-8'),  
                            top: 0,
                            left: 0,
                            blend: 'over'
                        };                    
                    });

                    const tempOutputPath = outputPath + '_temp.png';

                    sharp(inputPath)
                        .composite(overlayOptions)
                        .toFile(tempOutputPath)
                        .then(() => {
                            fs.renameSync(tempOutputPath, outputPath);
                            resolve();
                        })
                        .catch(err => {
                            console.error('Error processing image with overlays:', err);
                            reject(err);
                        });
                })
                .catch(error => {
                    console.error('Failed to detect text:', error);
                    reject(error);
                });
            })
            .catch(err => {
                console.error('Error getting image metadata:', err);
                reject(err);
            });
    });
}


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
