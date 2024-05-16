# pip install Flask pytesseract Pillow
from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import io

app = Flask(__name__)

@app.route('/detect_text', methods=['POST'])
def detect_text():
    if 'image' not in request.files:
        return jsonify(error='No image provided.'), 400

    image_file = request.files['image']
    image = Image.open(io.BytesIO(image_file.read()))
    
    # Perform text detection
    custom_config = r'--oem 3 --psm 11'
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config=custom_config)
    n_boxes = len(data['level'])
    boxes = []
    for i in range(n_boxes):
        if int(data['conf'][i]) > 60:  # Confidence threshold
            (x, y, w, h) = (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
            boxes.append({'x': x, 'y': y, 'width': w, 'height': h})
    
    return jsonify(boxes=boxes)

if __name__ == '__main__':
    app.run(port=5000)
