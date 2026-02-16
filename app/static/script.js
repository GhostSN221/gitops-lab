let usageChart, roleChart;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    loadUsers();
    loadActivities();
    updateSystemStats();
    
    // Mise à jour des stats toutes les 5 secondes
    setInterval(updateSystemStats, 5000);
    setInterval(loadUsers, 10000);
});

function initCharts() {
    // Chart d'utilisation CPU/Mémoire
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    usageChart = new Chart(usageCtx, {
        type: 'line',
        data: {
            labels: ['10s', '8s', '6s', '4s', '2s', 'Maintenant'],
            datasets: [{
                label: 'CPU %',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                tension: 0.4
            }, {
                label: 'Mémoire %',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.05)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Chart des rôles
    const roleCtx = document.getElementById('roleChart').getContext('2d');
    roleChart = new Chart(roleCtx, {
        type: 'doughnut',
        data: {
            labels: ['Admin', 'User', 'Moderator'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function updateSystemStats() {
    try {
        const response = await fetch('/api/system');
        const data = await response.json();
        
        // Mise à jour des cartes
        document.getElementById('cpu-usage').textContent = data.cpu_percent + '%';
        document.getElementById('memory-usage').textContent = data.memory_percent + '%';
        document.getElementById('disk-usage').textContent = data.disk_usage + '%';
        
        // Mise à jour du graphique
        if (usageChart) {
            usageChart.data.datasets[0].data.shift();
            usageChart.data.datasets[0].data.push(data.cpu_percent);
            usageChart.data.datasets[1].data.shift();
            usageChart.data.datasets[1].data.push(data.memory_percent);
            usageChart.update();
        }
    } catch (error) {
        console.error('Erreur système:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';
        
        document.getElementById('user-count').textContent = users.length;
        
        users.forEach(user => {
            const statusClass = user.status === 'actif' ? 'success' : 'secondary';
            tbody.innerHTML += `
                <tr>
                    <td>#${user.id}</td>
                    <td><i class="bi bi-person-circle me-2"></i>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge bg-info">${user.role}</span></td>
                    <td><span class="badge bg-${statusClass}">${user.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        // Mise à jour du chart des rôles
        updateRoleChart(users);
    } catch (error) {
        console.error('Erreur chargement users:', error);
    }
}

function updateRoleChart(users) {
    const roles = {
        'Admin': 0,
        'User': 0,
        'Moderator': 0
    };
    
    users.forEach(user => {
        if (roles[user.role] !== undefined) {
            roles[user.role]++;
        }
    });
    
    roleChart.data.datasets[0].data = [roles.Admin, roles.User, roles.Moderator];
    roleChart.update();
}

async function loadActivities() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        const list = document.getElementById('activities-list');
        list.innerHTML = '';
        
        data.mock_data.recent_activities.forEach(activity => {
            const statusClass = activity.status === 'success' || activity.status === 'completed' ? 'success' : 'danger';
            list.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-person me-2"></i>
                        <strong>${activity.user}</strong> - ${activity.action}
                    </div>
                    <div>
                        <small class="text-muted me-3">${activity.time}</small>
                        <span class="badge bg-${statusClass}">${activity.status}</span>
                    </div>
                </li>
            `;
        });
    } catch (error) {
        console.error('Erreur chargement activités:', error);
    }
}

async function addUser() {
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value
    };
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            // Fermer le modal
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            
            // Reset form
            document.getElementById('addUserForm').reset();
            
            // Recharger les users
            loadUsers();
            
            // Notification
            showNotification('Utilisateur ajouté avec succès!', 'success');
        }
    } catch (error) {
        console.error('Erreur ajout user:', error);
        showNotification('Erreur lors de l\'ajout', 'danger');
    }
}

function showNotification(message, type) {
    // Créer une notification toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Menu navigation
document.querySelectorAll('.list-group-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.list-group-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        // Ici tu peux ajouter la logique pour changer le contenu
    });
});
