<script>
	import { onMount } from 'svelte';
	import { authStore, isAuthenticated } from '../../stores/auth.js';
	import { smartLinksStore } from '../../stores/smartlinks.js';
	import { analyticsService } from '../../services/analytics.js';
	import { goto } from '$app/navigation';
	import Chart from 'chart.js/auto';
	
	// Component state
	let analytics = null;
	let loading = true;
	let error = null;
	let selectedPeriod = '30days';
	let selectedSmartLink = 'all';
	
	// Chart references
	let clicksChart = null;
	let platformsChart = null;
	let countriesChart = null;
	let devicesChart = null;
	
	// Chart canvas references
	let clicksCanvas;
	let platformsCanvas;
	let countriesCanvas;
	let devicesCanvas;
	
	// Reactive variables
	$: user = $authStore.user;
	$: smartLinks = $smartLinksStore.smartLinks;
	
	// Period options
	const periodOptions = [
		{ value: '7days', label: '7 derniers jours' },
		{ value: '30days', label: '30 derniers jours' },
		{ value: '90days', label: '3 derniers mois' },
		{ value: '1year', label: '12 derniers mois' }
	];
	
	// Load analytics data
	onMount(async () => {
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		
		// Load SmartLinks first
		await smartLinksStore.loadSmartLinks(true);
		
		// Load analytics
		await loadAnalytics();
	});
	
	async function loadAnalytics() {
		if (!user) return;
		
		loading = true;
		error = null;
		
		try {
			const startDate = getStartDate(selectedPeriod);
			const endDate = new Date();
			
			if (selectedSmartLink === 'all') {
				// Load aggregated analytics for all SmartLinks
				analytics = await analyticsService.getUserAnalytics(user.uid, {
					startDate,
					endDate
				});
			} else {
				// Load analytics for specific SmartLink
				analytics = await analyticsService.getSmartLinkAnalytics(selectedSmartLink, {
					startDate,
					endDate,
					groupBy: getPeriodGrouping(selectedPeriod)
				});
			}
			
			if (!analytics) {
				analytics = getEmptyAnalytics();
			}
			
			// Update charts after analytics data is loaded
			setTimeout(() => {
				updateCharts();
			}, 100);
			
		} catch (err) {
			console.error('Failed to load analytics:', err);
			error = 'Impossible de charger les statistiques';
			analytics = getEmptyAnalytics();
		} finally {
			loading = false;
		}
	}
	
	function getStartDate(period) {
		const now = new Date();
		switch (period) {
			case '7days':
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case '30days':
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			case '90days':
				return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
			case '1year':
				return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
			default:
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		}
	}
	
	function getPeriodGrouping(period) {
		switch (period) {
			case '7days':
				return 'day';
			case '30days':
				return 'day';
			case '90days':
				return 'week';
			case '1year':
				return 'month';
			default:
				return 'day';
		}
	}
	
	function getEmptyAnalytics() {
		return {
			totalClicks: 0,
			uniqueVisitors: 0,
			smartLinksCount: 0,
			timeSeries: [],
			countries: [],
			devices: [],
			browsers: [],
			referrers: [],
			platforms: [],
			hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }))
		};
	}
	
	// Update charts
	function updateCharts() {
		if (!analytics) return;
		
		// Destroy existing charts
		[clicksChart, platformsChart, countriesChart, devicesChart].forEach(chart => {
			if (chart) {
				chart.destroy();
			}
		});
		
		// Create new charts
		createClicksChart();
		createPlatformsChart();
		createCountriesChart();
		createDevicesChart();
	}
	
	function createClicksChart() {
		if (!clicksCanvas || !analytics.timeSeries) return;
		
		const ctx = clicksCanvas.getContext('2d');
		clicksChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: analytics.timeSeries.map(point => formatChartDate(point.date)),
				datasets: [
					{
						label: 'Clics',
						data: analytics.timeSeries.map(point => point.clicks),
						borderColor: '#1976d2',
						backgroundColor: 'rgba(25, 118, 210, 0.1)',
						fill: true,
						tension: 0.4
					},
					{
						label: 'Visiteurs uniques',
						data: analytics.timeSeries.map(point => point.uniqueVisitors),
						borderColor: '#d32f2f',
						backgroundColor: 'rgba(211, 47, 47, 0.1)',
						fill: false,
						tension: 0.4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Évolution des clics dans le temps'
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});
	}
	
	function createPlatformsChart() {
		if (!platformsCanvas || !analytics.platforms || analytics.platforms.length === 0) return;
		
		const ctx = platformsCanvas.getContext('2d');
		platformsChart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: analytics.platforms.map(p => p.name),
				datasets: [{
					data: analytics.platforms.map(p => p.count),
					backgroundColor: [
						'#1DB954', // Spotify
						'#FA243C', // Apple Music
						'#FF0000', // YouTube
						'#FEAA2D', // Deezer
						'#FF5500', // SoundCloud
						'#629AA0', // Bandcamp
						'#232F3E', // Amazon
						'#00C9FF'  // Other
					]
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Répartition par plateforme'
					},
					legend: {
						position: 'bottom'
					}
				}
			}
		});
	}
	
	function createCountriesChart() {
		if (!countriesCanvas || !analytics.countries || analytics.countries.length === 0) return;
		
		const ctx = countriesCanvas.getContext('2d');
		countriesChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: analytics.countries.slice(0, 10).map(c => c.name),
				datasets: [{
					label: 'Clics par pays',
					data: analytics.countries.slice(0, 10).map(c => c.count),
					backgroundColor: '#1976d2'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Top 10 des pays'
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});
	}
	
	function createDevicesChart() {
		if (!devicesCanvas || !analytics.devices || analytics.devices.length === 0) return;
		
		const ctx = devicesCanvas.getContext('2d');
		devicesChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: analytics.devices.map(d => d.name),
				datasets: [{
					data: analytics.devices.map(d => d.count),
					backgroundColor: [
						'#2e7d32', // Desktop
						'#f57c00', // Mobile
						'#d32f2f'  // Tablet
					]
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Répartition par type d\'appareil'
					},
					legend: {
						position: 'bottom'
					}
				}
			}
		});
	}
	
	function formatChartDate(dateString) {
		const date = new Date(dateString);
		const period = getPeriodGrouping(selectedPeriod);
		
		if (period === 'month') {
			return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
		} else if (period === 'week') {
			return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
		} else {
			return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
		}
	}
	
	// Handle filter changes
	async function handlePeriodChange() {
		await loadAnalytics();
	}
	
	async function handleSmartLinkChange() {
		await loadAnalytics();
	}
	
	// Export data
	async function exportData() {
		if (!analytics) return;
		
		try {
			const exportData = {
				period: selectedPeriod,
				smartLink: selectedSmartLink,
				generatedAt: new Date().toISOString(),
				summary: {
					totalClicks: analytics.totalClicks,
					uniqueVisitors: analytics.uniqueVisitors,
					smartLinksCount: analytics.smartLinksCount
				},
				timeSeries: analytics.timeSeries,
				platforms: analytics.platforms,
				countries: analytics.countries,
				devices: analytics.devices
			};
			
			const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
				type: 'application/json' 
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `smartlink-analytics-${selectedPeriod}-${new Date().getTime()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export failed:', err);
		}
	}
	
	// Format number for display
	function formatNumber(num) {
		if (!num) return '0';
		return num.toLocaleString('fr-FR');
	}
	
	// Get percentage change (mock data for demo)
	function getChangePercentage(current, previous = 0) {
		if (previous === 0) return 0;
		return Math.round(((current - previous) / previous) * 100);
	}
</script>

<svelte:head>
	<title>Analytics - SmartLink</title>
	<meta name="description" content="Consultez les statistiques détaillées de vos SmartLinks." />
</svelte:head>

<div class="analytics">
	<!-- Header -->
	<div class="analytics-header">
		<h1>Analytics</h1>
		<p>Analysez les performances de vos SmartLinks en détail</p>
	</div>
	
	<!-- Filters -->
	<div class="filters-section">
		<div class="filters">
			<div class="filter-group">
				<label for="period">Période</label>
				<select id="period" bind:value={selectedPeriod} on:change={handlePeriodChange}>
					{#each periodOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-group">
				<label for="smartlink">SmartLink</label>
				<select id="smartlink" bind:value={selectedSmartLink} on:change={handleSmartLinkChange}>
					<option value="all">Tous les SmartLinks</option>
					{#each smartLinks as smartLink}
						<option value={smartLink.id}>{smartLink.title}</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-actions">
				<button class="btn-secondary" on:click={exportData} disabled={loading}>
					📊 Exporter les données
				</button>
			</div>
		</div>
	</div>
	
	{#if loading}
		<!-- Loading State -->
		<div class="loading-section">
			<div class="loading-spinner"></div>
			<p>Chargement des statistiques...</p>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="error-section">
			<div class="error-message">
				<h3>Erreur</h3>
				<p>{error}</p>
				<button class="btn-primary" on:click={loadAnalytics}>Réessayer</button>
			</div>
		</div>
	{:else if analytics}
		<!-- Analytics Content -->
		
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="summary-card">
				<div class="card-icon">👆</div>
				<div class="card-content">
					<div class="card-number">{formatNumber(analytics.totalClicks)}</div>
					<div class="card-label">Clics total</div>
					<div class="card-change positive">+{getChangePercentage(analytics.totalClicks)}%</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">👥</div>
				<div class="card-content">
					<div class="card-number">{formatNumber(analytics.uniqueVisitors)}</div>
					<div class="card-label">Visiteurs uniques</div>
					<div class="card-change positive">+{getChangePercentage(analytics.uniqueVisitors)}%</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">🔗</div>
				<div class="card-content">
					<div class="card-number">{analytics.smartLinksCount || smartLinks.length}</div>
					<div class="card-label">SmartLinks actifs</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">📈</div>
				<div class="card-content">
					<div class="card-number">
						{analytics.totalClicks > 0 ? Math.round((analytics.uniqueVisitors / analytics.totalClicks) * 100) : 0}%
					</div>
					<div class="card-label">Taux de conversion</div>
					<div class="card-change positive">+2%</div>
				</div>
			</div>
		</div>
		
		<!-- Charts Section -->
		<div class="charts-section">
			<!-- Clicks Evolution Chart -->
			<div class="chart-container full-width">
				<canvas bind:this={clicksCanvas} id="clicksChart"></canvas>
			</div>
			
			<div class="charts-row">
				<!-- Platforms Chart -->
				<div class="chart-container">
					<canvas bind:this={platformsCanvas} id="platformsChart"></canvas>
				</div>
				
				<!-- Devices Chart -->
				<div class="chart-container">
					<canvas bind:this={devicesCanvas} id="devicesChart"></canvas>
				</div>
			</div>
			
			<!-- Countries Chart -->
			<div class="chart-container full-width">
				<canvas bind:this={countriesCanvas} id="countriesChart"></canvas>
			</div>
		</div>
		
		<!-- Details Tables -->
		<div class="tables-section">
			<div class="table-container">
				<h3>🌍 Top pays</h3>
				{#if analytics.countries.length > 0}
					<table class="analytics-table">
						<thead>
							<tr>
								<th>Pays</th>
								<th>Clics</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							{#each analytics.countries.slice(0, 10) as country}
								<tr>
									<td>{country.name}</td>
									<td>{formatNumber(country.count)}</td>
									<td>
										{analytics.totalClicks > 0 
											? Math.round((country.count / analytics.totalClicks) * 100) 
											: 0}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="empty-data">
						<p>Aucune donnée géographique disponible</p>
					</div>
				{/if}
			</div>
			
			<div class="table-container">
				<h3>🎵 Plateformes</h3>
				{#if analytics.platforms.length > 0}
					<table class="analytics-table">
						<thead>
							<tr>
								<th>Plateforme</th>
								<th>Clics</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							{#each analytics.platforms as platform}
								<tr>
									<td>{platform.name}</td>
									<td>{formatNumber(platform.count)}</td>
									<td>
										{analytics.totalClicks > 0 
											? Math.round((platform.count / analytics.totalClicks) * 100) 
											: 0}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="empty-data">
						<p>Aucune donnée de plateforme disponible</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Peak Hours Chart -->
		{#if analytics.hours && analytics.hours.some(h => h.clicks > 0)}
			<div class="peak-hours-section">
				<h3>📅 Heures de pointe</h3>
				<div class="hours-chart">
					{#each analytics.hours as hour}
						<div class="hour-bar">
							<div 
								class="hour-fill"
								style="height: {Math.max(5, (hour.clicks / Math.max(...analytics.hours.map(h => h.clicks))) * 100)}%"
							></div>
							<div class="hour-label">{hour.hour}h</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.analytics {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--smartlink-spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--smartlink-spacing-xl);
	}
	
	/* Header */
	.analytics-header {
		text-align: center;
		margin-bottom: var(--smartlink-spacing-lg);
	}
	
	.analytics-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--pico-color);
		margin-bottom: var(--smartlink-spacing-sm);
	}
	
	.analytics-header p {
		color: var(--pico-muted-color);
		font-size: 1.125rem;
	}
	
	/* Filters */
	.filters-section {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-lg);
	}
	
	.filters {
		display: flex;
		align-items: end;
		gap: var(--smartlink-spacing-lg);
		flex-wrap: wrap;
	}
	
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--smartlink-spacing-sm);
		min-width: 200px;
	}
	
	.filter-group label {
		font-weight: 500;
		color: var(--pico-color);
		font-size: 0.875rem;
	}
	
	.filter-group select {
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-md);
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-md);
		background: var(--pico-card-background-color);
		color: var(--pico-color);
	}
	
	.filter-actions {
		margin-left: auto;
	}
	
	/* Loading State */
	.loading-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--smartlink-spacing-3xl);
		gap: var(--smartlink-spacing-lg);
	}
	
	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--smartlink-gray-200);
		border-top: 3px solid var(--smartlink-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* Error State */
	.error-section {
		display: flex;
		justify-content: center;
		padding: var(--smartlink-spacing-3xl);
	}
	
	.error-message {
		text-align: center;
		background: var(--smartlink-error-light);
		border: 1px solid var(--smartlink-error);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-xl);
	}
	
	.error-message h3 {
		color: var(--smartlink-error);
		margin-bottom: var(--smartlink-spacing-md);
	}
	
	/* Summary Cards */
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--smartlink-spacing-lg);
	}
	
	.summary-card {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-xl);
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-md);
		transition: all 0.15s ease;
	}
	
	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--smartlink-shadow-lg);
	}
	
	.card-icon {
		font-size: 2rem;
		width: 60px;
		height: 60px;
		background: var(--smartlink-primary-light);
		border-radius: var(--smartlink-radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.card-content {
		flex: 1;
	}
	
	.card-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--pico-color);
		line-height: 1;
		margin-bottom: var(--smartlink-spacing-xs);
	}
	
	.card-label {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
		margin-bottom: var(--smartlink-spacing-xs);
	}
	
	.card-change {
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	.card-change.positive {
		color: var(--smartlink-success);
	}
	
	.card-change.negative {
		color: var(--smartlink-error);
	}
	
	/* Charts */
	.charts-section {
		display: flex;
		flex-direction: column;
		gap: var(--smartlink-spacing-lg);
	}
	
	.charts-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--smartlink-spacing-lg);
	}
	
	.chart-container {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-lg);
		height: 400px;
		position: relative;
	}
	
	.chart-container.full-width {
		grid-column: 1 / -1;
	}
	
	.chart-container canvas {
		width: 100% !important;
		height: 100% !important;
	}
	
	/* Tables */
	.tables-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--smartlink-spacing-lg);
	}
	
	.table-container {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-lg);
	}
	
	.table-container h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--pico-color);
		margin-bottom: var(--smartlink-spacing-md);
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
	}
	
	.analytics-table {
		width: 100%;
		border-collapse: collapse;
	}
	
	.analytics-table th,
	.analytics-table td {
		text-align: left;
		padding: var(--smartlink-spacing-sm);
		border-bottom: 1px solid var(--pico-muted-border-color);
	}
	
	.analytics-table th {
		font-weight: 600;
		color: var(--pico-color);
		background: var(--smartlink-gray-50);
		font-size: 0.875rem;
	}
	
	.analytics-table td {
		color: var(--pico-color);
		font-size: 0.875rem;
	}
	
	.analytics-table tr:hover td {
		background: var(--smartlink-gray-50);
	}
	
	.empty-data {
		text-align: center;
		padding: var(--smartlink-spacing-xl);
		color: var(--pico-muted-color);
	}
	
	/* Peak Hours */
	.peak-hours-section {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-lg);
	}
	
	.peak-hours-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--pico-color);
		margin-bottom: var(--smartlink-spacing-lg);
	}
	
	.hours-chart {
		display: flex;
		align-items: end;
		gap: 2px;
		height: 150px;
		padding: var(--smartlink-spacing-md) 0;
	}
	
	.hour-bar {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		position: relative;
	}
	
	.hour-fill {
		background: var(--smartlink-primary);
		width: 100%;
		border-radius: 2px 2px 0 0;
		transition: height 0.3s ease;
		margin-top: auto;
		min-height: 5px;
	}
	
	.hour-label {
		font-size: 0.625rem;
		color: var(--pico-muted-color);
		margin-top: var(--smartlink-spacing-xs);
		text-align: center;
	}
	
	/* Buttons */
	.btn-primary,
	.btn-secondary {
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-lg);
		border-radius: var(--smartlink-radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
		font-size: 0.875rem;
	}
	
	.btn-primary {
		background: var(--smartlink-primary);
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: var(--smartlink-primary-hover);
		transform: translateY(-1px);
	}
	
	.btn-secondary {
		background: none;
		color: var(--smartlink-primary);
		border: 1px solid var(--smartlink-primary);
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: var(--smartlink-primary);
		color: white;
	}
	
	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.analytics {
			padding: var(--smartlink-spacing-md);
		}
		
		.analytics-header h1 {
			font-size: 2rem;
		}
		
		.filters {
			flex-direction: column;
			align-items: stretch;
		}
		
		.filter-group {
			min-width: auto;
		}
		
		.filter-actions {
			margin-left: 0;
		}
		
		.summary-cards {
			grid-template-columns: 1fr;
		}
		
		.charts-row {
			grid-template-columns: 1fr;
		}
		
		.tables-section {
			grid-template-columns: 1fr;
		}
		
		.chart-container {
			height: 300px;
		}
		
		.hours-chart {
			height: 120px;
		}
		
		.hour-label {
			font-size: 0.5rem;
		}
	}
</style>