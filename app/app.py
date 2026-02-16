from flask import Flask, jsonify, render_template, request
import socket
import os
import psutil
import datetime
import json
import subprocess
from datetime import datetime

app = Flask(__name__)

# Données mock pour le dashboard
MOCK_DATA = {
    "users": [
        {"id": 1, "name": "Alice Martin", "email": "alice@example.com", "role": "Admin", "status": "actif"},
        {"id": 2, "name": "Bob Dupont", "email": "bob@example.com", "role": "User", "status": "actif"},
        {"id": 3, "name": "Claire Bernard", "email": "claire@example.com", "role": "User", "status": "inactif"},
        {"id": 4, "name": "David Cohen", "email": "david@example.com", "role": "Moderator", "status": "actif"},
    ],
    "stats": {
        "total_requests": 15420,
        "active_users": 3,
        "api_calls": 892,
        "uptime": "99.9%"
    },
    "recent_activities": [
        {"user": "Alice", "action": "Login", "time": "2026-02-14 10:30", "status": "success"},
        {"user": "Bob", "action": "Upload", "time": "2026-02-14 10:15", "status": "success"},
        {"user": "System", "action": "Backup", "time": "2026-02-14 09:45", "status": "completed"},
        {"user": "Claire", "action": "Login", "time": "2026-02-14 09:20", "status": "failed"},
    ]
}

@app.route('/')
def home():
    return render_template('index.html', 
                         hostname=socket.gethostname(),
                         environment=os.getenv('ENVIRONMENT', 'lab'))

@app.route('/api/data')
def api_data():
    """API endpoint pour les données du dashboard"""
    return jsonify({
        'hostname': socket.gethostname(),
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('ENVIRONMENT', 'lab'),
        'mock_data': MOCK_DATA
    })

@app.route('/api/system')
def api_system():
    """API endpoint pour les métriques système"""
    return jsonify({
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent,
        'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat()
    })

@app.route('/api/users')
def get_users():
    return jsonify(MOCK_DATA['users'])

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    new_user = {
        'id': len(MOCK_DATA['users']) + 1,
        'name': data['name'],
        'email': data['email'],
        'role': data.get('role', 'User'),
        'status': 'actif'
    }
    MOCK_DATA['users'].append(new_user)
    MOCK_DATA['stats']['active_users'] += 1
    return jsonify(new_user), 201

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
