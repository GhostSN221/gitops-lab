from flask import Flask, render_template
import socket
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html', 
                         hostname=socket.gethostname(),
                         environment=os.getenv('ENVIRONMENT', 'lab'))

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
