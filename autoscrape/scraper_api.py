from flask import Flask, request, jsonify
import subprocess
import sys
import os
import json

app = Flask(__name__)

# Path to your autoscrape.py script
AUTOSCRAPE_PATH = os.path.join(os.path.dirname(__file__), 'autoscrape.py')

@app.route('/scrape')
def scrape():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code parameter'}), 400
    # Example: you might want to map code to a URL or config
    # For demo, let's assume you have a config or URL pattern for drug info
    # Here, just return a dummy result if not implemented
    # You can adapt this to call autoscrape.py with a config or URL
    # For now, let's call autoscrape.py with a dummy URL (replace with real logic)
    url = f'https://openfda.gov/drug/{code}'  # Replace with real lookup logic
    try:
        # Call autoscrape.py as a subprocess
        result = subprocess.run([
            sys.executable, AUTOSCRAPE_PATH, url, '--max-pages', '1', '--out-jsonl', 'result.jsonl', '--out-csv', 'result.csv'
        ], capture_output=True, text=True, timeout=30)
        # Read the first result from result.jsonl
        if os.path.exists('result.jsonl'):
            with open('result.jsonl', 'r', encoding='utf-8') as f:
                line = f.readline()
                if line:
                    data = json.loads(line)
                    return jsonify(data)
        return jsonify({'error': 'No data found', 'stderr': result.stderr}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
