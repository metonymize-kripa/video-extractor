
# Video Frame Extractor

## Overview
The Video Frame Extractor is a web application that enables users to upload a video, specify keyframe times in seconds, and retrieve those frames with detected text highlighted by bounding boxes. The application utilizes Node.js for server-side operations and a Python script integrated with Tesseract OCR for text detection.

## Key Features
- **Video Upload**: Users can upload video files directly through the interface.
- **Specify Keyframes**: Users can input keyframe times in seconds where the video should be processed to extract frames.
- **Text Detection**: Implements a Python helper function leveraging Tesseract OCR to detect text within the extracted frames and draw bounding boxes around them.
- **Bootstrap Integration**: Uses Bootstrap for responsive and aesthetic UI elements, making the application accessible on various devices.

## Technologies Used
- **Node.js**: Backend server management and file handling.
- **Python with Tesseract OCR**: For optical character recognition to detect and process text within video frames.
- **Bootstrap**: For front-end design to ensure the application is responsive and user-friendly.

## Getting Started

### Prerequisites
- Install [Node.js](https://nodejs.org/en/) and npm.
- Install [Python 3](https://www.python.org/downloads/).
- Install Tesseract OCR; follow the installation guide on the [Tesseract GitHub](https://github.com/tesseract-ocr/tesseract).

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/video-frame-data-extractor.git
   cd video-frame-data-extractor
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   pip install pytesseract Pillow
   ```

### Running the Application
1. **Start the Node.js server:**
   ```bash
   node server.js
   ```
   This will run the server on `http://localhost:3000`.

2. **Access the web application:**
   Navigate to `http://localhost:3000` in your web browser to start using the application.

3. **Upload a video and specify keyframes:**
   Use the provided form to upload a video file and enter the desired keyframes in seconds (e.g., `5, 10, 15`).

4. **View the results:**
   Processed frames will be displayed on the web page with text highlighted.

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests with your proposed changes.