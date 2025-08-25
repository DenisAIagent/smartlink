<script>
	import { onMount } from 'svelte';
	import { getAllSmartLinksStats, debugStorage, clearAllSmartLinks } from '$lib/smartlinks.js';
	import { getShortUrl, getFullUrlFromShort } from '$lib/config.js';
	import { requireAuth, getCurrentUser, isAuthenticated } from '$lib/auth.js';
	
	let loading = true;
	let user = {
		name: 'Denis Adam',
		email: 'denis@mdmcmusicads.com',
		plan: 'Pro',
		linksCreated: 3,
		totalClicks: 1247,
		thisMonth: 342
	};
	
	let smartLinks = [];
	
	onMount(() => {
		// Vérification d'authentification - si non connecté, on sera redirigé
		if (!isAuthenticated()) {
			requireAuth();
			return; // Empêcher l'exécution du reste si redirection
		}
		
		try {
			console.log('Dashboard: Starting data load...');
			
			// Load SmartLinks from storage
			let links = [];
			try {
				links = getAllSmartLinksStats() || [];
				console.log('Dashboard: Links loaded:', links.length, 'items');
			} catch (linkError) {
				console.error('Dashboard: Error loading SmartLinks:', linkError);
				links = []; // Fallback to empty array
			}
			
			// Transform data for dashboard display
			smartLinks = links.map((link, index) => {
				try {
					return {
						id: link.slug || `link-${index}`,
						title: link.title || 'Titre non disponible',
						shortUrl: link.slug ? getShortUrl(link.slug) : '#',
						clicks: link.clicks || 0,
						created: link.createdAt ? new Date(link.createdAt).toLocaleDateString('fr-FR', { 
							day: 'numeric', 
							month: 'long', 
							year: 'numeric' 
						}) : 'Date inconnue',
						platforms: [],
						platformCount: link.platforms || 0,
						artist: link.artist || 'Artiste inconnu'
					};
				} catch (transformError) {
					console.error('Dashboard: Error transforming link:', transformError, link);
					return {
						id: `error-${index}`,
						title: 'Erreur de chargement',
						shortUrl: '#',
						clicks: 0,
						created: 'N/A',
						platforms: [],
						platformCount: 0,
						artist: 'N/A'
					};
				}
			});
			
			// Update user stats
			const totalClicks = smartLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
			user.linksCreated = smartLinks.length;
			user.totalClicks = totalClicks;
			user.thisMonth = Math.floor(totalClicks * 0.3);
			
			console.log('Dashboard: Data processed successfully, smartLinks:', smartLinks.length);
		} catch (error) {
			console.error('Dashboard: Critical error:', error);
			// Données par défaut en cas d'erreur critique
			smartLinks = [];
			user.linksCreated = 0;
			user.totalClicks = 0;
			user.thisMonth = 0;
		}
		
		// TOUJOURS mettre loading à false
		loading = false;
		console.log('Dashboard: Loading completed, loading =', loading);
	});
	
	function createNewLink() {
		window.location.href = '/smartlinks/new';
	}
	
	function editLink(linkId) {
		alert(`✏️ Édition du lien ${linkId} à venir !`);
	}
	
	function copyLink(shortUrl) {
		// Use the full URL for copying
		const fullUrl = getFullUrlFromShort(shortUrl);
		navigator.clipboard.writeText(fullUrl);
		alert('🎯 Lien copié dans le presse-papiers !');
	}
	
	function logout() {
		if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
			window.location.href = '/auth';
		}
	}
	
	function debugStorageState() {
		debugStorage();
		alert('🔍 État du stockage affiché dans la console (F12)');
	}
	
	function clearStorage() {
		if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer tous les SmartLinks ? Cette action est irréversible.')) {
			clearAllSmartLinks();
			location.reload();
		}
	}
</script>

<svelte:head>
	<title>Tableau de bord - SmartLink</title>
</svelte:head>

{#if loading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>Chargement de votre tableau de bord...</p>
	</div>
{:else}
	<div class="dashboard">
		<!-- Header -->
		<header class="dashboard-header">
			<div class="header-content">
				<div class="logo">
					<span class="logo-icon">🎵</span>
					<span class="logo-text">SmartLink</span>
				</div>
				<div class="header-actions">
					<div class="user-info">
						<span class="user-name">{user.name}</span>
						<span class="user-plan">Plan {user.plan}</span>
					</div>
					<div class="header-actions">
						<button class="debug-btn" on:click={debugStorageState} title="Voir l'état du stockage">
							🔍
						</button>
						<button class="clear-btn" on:click={clearStorage} title="Vider le stockage">
							🗑️
						</button>
						<button class="logout-btn" on:click={logout}>
							<span>🚪</span>
							Déconnexion
						</button>
					</div>
				</div>
			</div>
		</header>

		<div class="dashboard-content">
			<!-- Welcome Section -->
			<section class="welcome-section">
				<div class="welcome-content">
					<h1>Bonjour {user.name} ! 👋</h1>
					<p>Voici un aperçu de vos performances</p>
				</div>
				<div class="welcome-actions">
					<button class="btn-primary" on:click={createNewLink}>
						➕ Créer un SmartLink
					</button>
					<button class="btn-secondary" on:click={() => alert('Analytics à venir !')}>
						📊 Voir les Analytics
					</button>
				</div>
			</section>

			<!-- Stats Cards -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon">🔗</div>
					<div class="stat-info">
						<div class="stat-number">{user.linksCreated}</div>
						<div class="stat-label">SmartLinks créés</div>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">👆</div>
					<div class="stat-info">
						<div class="stat-number">{user.totalClicks.toLocaleString()}</div>
						<div class="stat-label">Clics total</div>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">📊</div>
					<div class="stat-info">
						<div class="stat-number">{user.thisMonth}</div>
						<div class="stat-label">Ce mois-ci</div>
					</div>
				</div>
				<div class="stat-card create-card" on:click={createNewLink} on:keydown={createNewLink}>
					<div class="stat-icon">➕</div>
					<div class="stat-info">
						<div class="stat-label">Créer un nouveau lien</div>
					</div>
				</div>
			</div>

			<!-- SmartLinks List -->
			<div class="links-section">
				<div class="section-header">
					<h2>Vos SmartLinks</h2>
					<button class="primary-button" on:click={createNewLink}>
						➕ Nouveau lien
					</button>
				</div>

				<div class="links-list">
					{#each smartLinks as link}
						<div class="link-card">
							<div class="link-main">
								<div class="link-info">
									<h3 class="link-title">{link.title}</h3>
									<div class="link-url">{link.shortUrl}</div>
									<div class="link-meta">
										<span class="link-clicks">{link.clicks} clics</span>
										<span class="link-date">Créé le {link.created}</span>
									</div>
								</div>
								<div class="link-stats">
									<div class="platforms">
										<span class="platform-count">{link.platformCount} plateforme{link.platformCount > 1 ? 's' : ''}</span>
									</div>
								</div>
							</div>
							<div class="link-actions">
								<button class="action-btn copy" on:click={() => copyLink(link.shortUrl)}>
									📋 Copier
								</button>
								<button class="action-btn edit" on:click={() => editLink(link.id)}>
									✏️ Éditer
								</button>
								<button class="action-btn stats">
									📊 Stats
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="quick-actions">
				<div class="section-header">
					<h2>Actions rapides</h2>
				</div>
				<div class="actions-grid">
					<button class="action-card" on:click={createNewLink}>
						<span class="action-icon">📈</span>
						<span>Analytics détaillées</span>
					</button>
					<button class="action-card">
						<span class="action-icon">⚙️</span>
						<span>Paramètres du compte</span>
					</button>
					<button class="action-card">
						<span class="action-icon">💳</span>
						<span>Gérer l'abonnement</span>
					</button>
					<button class="action-card">
						<span class="action-icon">❓</span>
						<span>Centre d'aide</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.loading-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f8fafc;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.dashboard {
		min-height: 100vh;
		background: #f8fafc;
	}

	/* Header */
	.dashboard-header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 1rem 0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: #3b82f6;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		text-align: right;
	}

	.user-name {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.875rem;
	}

	.user-plan {
		font-size: 0.75rem;
		color: #64748b;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.debug-btn, .clear-btn {
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.debug-btn:hover {
		background: #4b5563;
	}

	.clear-btn {
		background: #f59e0b;
	}

	.clear-btn:hover {
		background: #d97706;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		color: #475569;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: #e2e8f0;
		border-color: #cbd5e1;
	}

	/* Dashboard Content */
	.dashboard-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Welcome Section */
	.welcome-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		padding: 2rem;
		background: linear-gradient(135deg, #f0f9ff 0%, transparent 70%);
		border-radius: 1rem;
		border: 1px solid #e0f2fe;
		margin-bottom: 2rem;
	}

	.welcome-content h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.5rem;
	}

	.welcome-content p {
		color: #64748b;
		font-size: 1.125rem;
	}

	.welcome-actions {
		display: flex;
		gap: 1rem;
		flex-shrink: 0;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
	}

	.stat-card:hover {
		border-color: #cbd5e1;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.create-card {
		cursor: pointer;
		border: 2px dashed #cbd5e1;
		color: #64748b;
	}

	.create-card:hover {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #f0f9ff;
	}

	.stat-icon {
		font-size: 2rem;
		opacity: 0.8;
	}

	.stat-number {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}

	/* Links Section */
	.links-section {
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.primary-button, .btn-primary {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-button:hover, .btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: none;
		color: #3b82f6;
		border: 1px solid #3b82f6;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.btn-secondary:hover {
		background: #3b82f6;
		color: white;
	}

	/* Links List */
	.links-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.link-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.link-card:hover {
		border-color: #cbd5e1;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.link-main {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 1rem;
	}

	.link-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.link-url {
		color: #3b82f6;
		font-weight: 500;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.link-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #64748b;
	}

	.platforms {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.platform-count {
		background: #f1f5f9;
		color: #475569;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.link-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		color: #475569;
	}

	.action-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #f0f9ff;
	}

	/* Quick Actions */
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.action-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		color: #475569;
	}

	.action-card:hover {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #f0f9ff;
		transform: translateY(-2px);
	}

	.action-icon {
		font-size: 1.5rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.header-content {
			padding: 0 1rem;
		}

		.dashboard-content {
			padding: 1rem;
		}

		.welcome-section {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.welcome-actions {
			flex-direction: column;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.link-main {
			flex-direction: column;
			gap: 1rem;
		}

		.user-info {
			display: none;
		}

		.actions-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}

		.link-actions {
			justify-content: stretch;
		}

		.action-btn {
			flex: 1;
			text-align: center;
		}
	}
</style>