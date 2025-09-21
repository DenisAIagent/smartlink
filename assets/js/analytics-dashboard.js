// MDMC Analytics Dashboard - Advanced Analytics with Chart.js
class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.data = null;
        this.dateRange = 'week';
        this.init();
    }

    async init() {
        await this.loadChartJS();
        await this.fetchAnalyticsData();
        this.setupEventListeners();
        this.renderAllCharts();
        this.startRealTimeUpdates();
    }

    async loadChartJS() {
        // Dynamically load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            document.head.appendChild(script);
            
            return new Promise((resolve) => {
                script.onload = resolve;
            });
        }
    }

    async fetchAnalyticsData() {
        try {
            const response = await fetch(`/api/analytics/dashboard?range=${this.dateRange}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            this.data = await response.json();
            console.log('📊 Analytics data loaded:', this.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            this.data = null; // No fallback data
        }
    }

    setupEventListeners() {
        // Date range selector
        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.dateRange = e.target.dataset.range;
                this.updateDateRange();
            });
        });

        // Export buttons
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('exportPDF')?.addEventListener('click', () => this.exportPDF());
    }

    renderAllCharts() {
        this.renderClicksChart();
        this.renderPlatformsChart();
        this.renderGeographicChart();
        this.renderDevicesChart();
        this.renderConversionFunnel();
        this.renderHeatmap();
    }

    renderClicksChart() {
        const ctx = document.getElementById('clicksChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.clicks) {
            this.charts.clicks.destroy();
        }

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(229, 9, 20, 0.3)');
        gradient.addColorStop(1, 'rgba(229, 9, 20, 0)');

        this.charts.clicks = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateDateLabels(),
                datasets: [{
                    label: 'Clics',
                    data: this.data?.clicks || [],
                    borderColor: '#E50914',
                    backgroundColor: gradient,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#E50914',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y} clics`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            callback: (value) => {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderPlatformsChart() {
        const ctx = document.getElementById('platformsChart');
        if (!ctx) return;

        if (this.charts.platforms) {
            this.charts.platforms.destroy();
        }

        const platformData = this.data?.platforms || {};

        this.charts.platforms = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(platformData),
                datasets: [{
                    data: Object.values(platformData),
                    backgroundColor: [
                        '#1DB954', // Spotify
                        '#FA243C', // Apple Music
                        '#FF0000', // YouTube
                        '#FF6600', // Deezer
                        '#FF5500', // SoundCloud
                        '#999999'  // Autres
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label} (${data.datasets[0].data[i]}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderGeographicChart() {
        const ctx = document.getElementById('geoChart');
        if (!ctx) return;

        if (this.charts.geo) {
            this.charts.geo.destroy();
        }

        const geoData = this.data?.countries || {};

        this.charts.geo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(geoData),
                datasets: [{
                    label: 'Visiteurs par pays',
                    data: Object.values(geoData),
                    backgroundColor: 'rgba(229, 9, 20, 0.8)',
                    borderColor: '#E50914',
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    }

    renderDevicesChart() {
        const ctx = document.getElementById('devicesChart');
        if (!ctx) return;

        if (this.charts.devices) {
            this.charts.devices.destroy();
        }

        const deviceData = this.data?.devices || {};

        this.charts.devices = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(deviceData),
                datasets: [{
                    data: Object.values(deviceData),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderConversionFunnel() {
        const container = document.getElementById('conversionFunnel');
        if (!container) return;

        const funnelData = this.data?.funnel || [];

        container.innerHTML = funnelData.map((stage, index) => {
            const percentage = index === 0 ? 100 : (stage.value / funnelData[0].value * 100).toFixed(1);
            const width = 100 - (index * 20);
            
            return `
                <div class="funnel-stage" style="width: ${width}%; background: ${stage.color}; opacity: ${1 - (index * 0.2)};">
                    <div class="funnel-label">
                        <strong>${stage.stage}</strong>
                        <span>${stage.value.toLocaleString()} (${percentage}%)</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderHeatmap() {
        const container = document.getElementById('clickHeatmap');
        if (!container) return;

        // Generate heatmap grid for click patterns
        const hours = Array.from({length: 24}, (_, i) => i);
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        
        let html = '<div class="heatmap-grid">';
        
        // Add hour labels
        html += '<div></div>'; // Empty corner
        hours.forEach(hour => {
            html += `<div class="heatmap-label-x">${hour}h</div>`;
        });
        
        // Add day rows
        days.forEach(day => {
            html += `<div class="heatmap-label-y">${day}</div>`;
            hours.forEach(hour => {
                const intensity = 0; // No data by default
                const color = this.getHeatmapColor(intensity);
                html += `<div class="heatmap-cell" style="background: ${color};" title="${day} ${hour}h: 0 clics"></div>`;
            });
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    getHeatmapColor(intensity) {
        const r = 229;
        const g = 9;
        const b = 20;
        return `rgba(${r}, ${g}, ${b}, ${intensity})`;
    }

    async updateDateRange() {
        // Show loading state
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.opacity = '0.5';
        });

        await this.fetchAnalyticsData();
        this.renderAllCharts();

        // Remove loading state
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.opacity = '1';
        });
    }

    startRealTimeUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.fetchAnalyticsData().then(() => {
                this.updateMetrics();
            });
        }, 30000);
    }

    updateMetrics() {
        // Update top metrics cards
        const metrics = {
            totalClicks: this.data?.totalClicks || 0,
            conversionRate: this.data?.conversionRate || 0,
            avgTimeOnPage: this.data?.avgTimeOnPage || 0,
            uniqueVisitors: this.data?.uniqueVisitors || 0
        };

        if (document.getElementById('totalClicks')) {
            document.getElementById('totalClicks').textContent = metrics.totalClicks.toLocaleString();
        }
        if (document.getElementById('conversionRate')) {
            document.getElementById('conversionRate').textContent = metrics.conversionRate + '%';
        }
        if (document.getElementById('avgTimeOnPage')) {
            document.getElementById('avgTimeOnPage').textContent = this.formatTime(metrics.avgTimeOnPage);
        }
        if (document.getElementById('uniqueVisitors')) {
            document.getElementById('uniqueVisitors').textContent = metrics.uniqueVisitors.toLocaleString();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    generateDateLabels() {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const today = new Date();
        const labels = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(days[date.getDay()]);
        }
        
        return labels;
    }

    // Removed generateRandomData() - no more random data generation

    async exportCSV() {
        const csvData = this.prepareCSVData();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${this.dateRange}_${Date.now()}.csv`;
        a.click();
    }

    prepareCSVData() {
        let csv = 'Date,Clics,Conversions,Taux de conversion,Plateforme principale\n';
        
        // Add data rows
        const dates = this.generateDateLabels();
        const clicks = this.data?.clicks || [];

        dates.forEach((date, i) => {
            const clickCount = clicks[i] || 0;
            const conversions = Math.floor(clickCount * 0.35);
            const rate = clickCount > 0 ? ((conversions / clickCount) * 100).toFixed(2) : '0.00';
            csv += `${date},${clickCount},${conversions},${rate}%,-\n`;
        });
        
        return csv;
    }

    async exportPDF() {
        // Load jsPDF if not already loaded
        if (typeof jsPDF === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => script.onload = resolve);
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Rapport Analytics MDMC', 20, 20);
        
        // Add date range
        doc.setFontSize(12);
        doc.text(`Période: ${this.dateRange}`, 20, 30);
        
        // Add metrics
        doc.setFontSize(14);
        doc.text('Métriques principales:', 20, 45);
        doc.setFontSize(11);
        doc.text(`Total de clics: ${this.data?.totalClicks || '0'}`, 30, 55);
        doc.text(`Taux de conversion: ${this.data?.conversionRate || '0'}%`, 30, 65);
        doc.text(`Visiteurs uniques: ${this.data?.uniqueVisitors || '0'}`, 30, 75);
        
        // Add charts as images
        const clicksChart = document.getElementById('clicksChart');
        if (clicksChart) {
            const imgData = clicksChart.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 20, 90, 170, 80);
        }
        
        // Save PDF
        doc.save(`analytics_report_${Date.now()}.pdf`);
    }

    // Removed getMockData() - no more fallback mock data
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('clicksChart')) {
            window.analyticsDashboard = new AnalyticsDashboard();
        }
    });
} else {
    if (document.getElementById('clicksChart')) {
        window.analyticsDashboard = new AnalyticsDashboard();
    }
}

// Add required styles
if (!document.getElementById('analytics-styles')) {
    const style = document.createElement('style');
    style.id = 'analytics-styles';
    style.textContent = `
        .chart-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            margin-bottom: 24px;
            transition: opacity 0.3s;
        }
        
        .chart-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #141414;
        }
        
        .funnel-stage {
            margin: 8px auto;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            color: white;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .funnel-stage:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .funnel-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .heatmap-grid {
            display: grid;
            grid-template-columns: 40px repeat(24, 1fr);
            gap: 2px;
            font-size: 10px;
        }
        
        .heatmap-cell {
            aspect-ratio: 1;
            border-radius: 2px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .heatmap-cell:hover {
            transform: scale(1.5);
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .heatmap-label-x {
            text-align: center;
            font-size: 9px;
            color: #666;
        }
        
        .heatmap-label-y {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            font-size: 11px;
            color: #666;
        }
        
        .metrics-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: #141414;
            margin: 8px 0;
        }
        
        .metric-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-change {
            font-size: 14px;
            font-weight: 600;
            margin-top: 8px;
        }
        
        .metric-change.positive {
            color: #10B981;
        }
        
        .metric-change.negative {
            color: #EF4444;
        }
    `;
    document.head.appendChild(style);
}