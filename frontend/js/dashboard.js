import { fetchAuthenticated } from './api.js';

// --- DOM Elements ---
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const createNewBtn = document.getElementById('create-new-btn');
const totalLinksP = document.getElementById('total-links');
const totalClicksP = document.getElementById('total-clicks');
const conversionRateP = document.getElementById('conversion-rate');
const linksTbody = document.getElementById('links-tbody');
const clicksChartCanvas = document.getElementById('clicks-chart');

let clicksChart = null; // To hold the chart instance

// --- Auth ---
function checkAuth() {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login.html';
    }
    return token;
}

function handleLogout() {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    window.location.href = '/login.html';
}

// --- Rendering Functions ---
function renderUserInfo(user) {
    userEmailSpan.textContent = user.email;
}

function renderStats(stats) {
    totalLinksP.textContent = stats.totalLinks;
    totalClicksP.textContent = stats.totalClicks;
    conversionRateP.textContent = stats.conversionRate;
}

function renderSmartlinksTable(links) {
    linksTbody.innerHTML = ''; // Clear existing rows
    if (links.length === 0) {
        linksTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No smartlinks found. Create one!</td></tr>';
        return;
    }

    links.forEach(link => {
        const row = document.createElement('tr');
        // Sanitize user-provided content before rendering to prevent XSS
        row.innerHTML = `
            <td>${DOMPurify.sanitize(link.title)}</td>
            <td>${DOMPurify.sanitize(link.artist_name)}</td>
            <td>${DOMPurify.sanitize(link.slug)}</td>
            <td>${link.clicks}</td>
            <td class="action-buttons">
                <button class="edit-btn" data-id="${link.id}">Edit</button>
                <button class="delete-btn" data-id="${link.id}">Delete</button>
            </td>
        `;
        linksTbody.appendChild(row);
    });
}

function renderClicksChart(links) {
    const labels = links.map(link => link.title);
    const data = links.map(link => link.clicks);

    if (clicksChart) {
        clicksChart.destroy(); // Destroy old chart before creating new one
    }

    clicksChart = new Chart(clicksChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '# of Clicks',
                data: data,
                backgroundColor: 'rgba(187, 134, 252, 0.5)',
                borderColor: 'rgba(187, 134, 252, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// --- Data Fetching and Initialization ---
async function initDashboard() {
    checkAuth();

    try {
        const [user, stats, links] = await Promise.all([
            fetchAuthenticated('/api/dashboard/me'),
            fetchAuthenticated('/api/dashboard/stats'),
            fetchAuthenticated('/api/smartlinks')
        ]);

        renderUserInfo(user.user);
        renderStats(stats);
        renderSmartlinksTable(links);
        renderClicksChart(links);

    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        // The fetchAuthenticated helper handles redirecting on 401,
        // but we can show a message for other errors if needed.
    }
}

// --- Event Listeners ---
logoutBtn.addEventListener('click', handleLogout);

createNewBtn.addEventListener('click', () => {
    window.location.href = '/smartlink.html';
});

linksTbody.addEventListener('click', async (e) => {
    const target = e.target;
    const linkId = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
        if (confirm(`Are you sure you want to delete this smartlink?`)) {
            try {
                await fetchAuthenticated(`/api/smartlinks/${linkId}`, { method: 'DELETE' });
                // Refresh dashboard data after deletion
                initDashboard();
            } catch (error) {
                alert(`Failed to delete smartlink: ${error.message}`);
            }
        }
    }

    if (target.classList.contains('edit-btn')) {
        // For now, we'll just log this. Inline editing is a complex feature.
        alert(`Editing smartlink with ID: ${linkId} is not implemented yet.`);
    }
});


// --- WebSocket Connection ---
function initWebSocketConnection() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('[WebSocket] Connection established.');
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', data);

            // If we get a message that smartlinks were updated, refresh the dashboard data
            if (data.type === 'SMARTLINKS_UPDATED') {
                console.log('[WebSocket] Refreshing dashboard due to update...');
                initDashboard();
            }
        } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
        }
    };

    socket.onclose = () => {
        console.log('[WebSocket] Connection closed. Attempting to reconnect in 5 seconds...');
        setTimeout(initWebSocketConnection, 5000); // Simple reconnect logic
    };

    socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        socket.close(); // This will trigger the onclose event and reconnect logic
    };
}


// --- Run ---
initDashboard();
initWebSocketConnection();
