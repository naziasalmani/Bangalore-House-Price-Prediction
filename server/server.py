from flask import Flask, request, jsonify
from flask_cors import CORS
import util

app = Flask(__name__)
CORS(app)

util.load_saved_artifacts()


@app.route('/get_location_names', methods=['GET'])
def get_location_names():
    return jsonify({
        'locations': util.get_location_names()
    })


@app.route('/predict_home_price', methods=['POST'])
def predict_home_price():
    try:
        total_sqft = float(request.form['total_sqft'])
        location = request.form['location']
        bhk = int(request.form['bhk'])
        bath = int(request.form['bath'])

        estimated_price = util.get_estimated_price(location, total_sqft, bhk, bath)

        return jsonify({
            'estimated_price': estimated_price
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        })


if __name__ == '__main__':
    print("Starting Flask Server...")
    app.run(debug=True)