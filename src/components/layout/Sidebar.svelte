<script>
	import { page } from '$app/stores';
	import { sidebar, responsive } from '../../stores/ui.js';
	import { authStore, userLimits } from '../../stores/auth.js';
	import { smartLinksStore, smartLinksCount } from '../../stores/smartlinks.js';
	
	// Reactive variables
	$: currentPath = $page.url.pathname;
	$: userData = $authStore.userData;
	$: isProUser = userData?.plan === 'pro';
	
	// Navigation items
	const navItems = [
		{ 
			href: '/dashboard', 
			label: 'Tableau de bord', 
			icon: '🏠',
			description: 'Vue d\'ensemble'
		},
		{ 
			href: '/smartlinks', 
			label: 'SmartLinks', 
			icon: '🔗',
			description: 'Gérer vos liens',
			badge: $smartLinksCount
		},
		{ 
			href: '/analytics', 
			label: 'Analytics', 
			icon: '📊',
			description: 'Statistiques'
		},
		{ 
			href: '/templates', 
			label: 'Templates', 
			icon: '🎨',
			description: 'Modèles'
		}
	];
	
	const settingsItems = [
		{ 
			href: '/profile', 
			label: 'Profil', 
			icon: '👤',
			description: 'Informations personnelles'
		},
		{ 
			href: '/settings', 
			label: 'Paramètres', 
			icon: '⚙️',
			description: 'Configuration'
		},
		{ 
			href: '/billing', 
			label: 'Facturation', 
			icon: '💳',
			description: 'Abonnement et paiements'
		}
	];
	
	// Close sidebar on mobile when clicking outside
	function closeSidebar() {
		if ($responsive.isMobile) {
			sidebar.close();
		}
	}
</script>

<aside 
	class="sidebar"
	class:open={$sidebar.isOpen}
	class:pinned={$sidebar.isPinned}
>
	<!-- Sidebar content -->
	<div class="sidebar-content">
		<!-- User info -->
		<div class="user-info">
			<div class="user-details">
				{#if userData?.photoURL}
					<img src={userData.photoURL} alt="Avatar" class="user-avatar" />
				{:else}
					<div class="user-avatar-fallback">
						{userData?.displayName?.charAt(0) || userData?.email?.charAt(0) || '?'}
					</div>
				{/if}
				
				<div class="user-text">
					<div class="user-name">{userData?.displayName || 'Utilisateur'}</div>
					<div class="user-plan">
						{#if isProUser}
							<span class="plan-badge pro">Pro</span>
						{:else}
							<span class="plan-badge free">Gratuit</span>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Usage stats for free users -->
			{#if !isProUser && $userLimits}
				<div class="usage-stats">
					<div class="usage-text">
						{$userLimits.currentCount} / {$userLimits.maxLinks} SmartLinks
					</div>
					<div class="usage-bar">
						<div 
							class="usage-fill"
							style="width: {($userLimits.currentCount / $userLimits.maxLinks) * 100}%"
						></div>
					</div>
					{#if !$userLimits.canCreateMore}
						<a href="/billing" class="upgrade-link">
							Passer au Pro
						</a>
					{/if}
				</div>
			{/if}
		</div>
		
		<!-- Main navigation -->
		<nav class="nav-section">
			<div class="nav-header">Navigation</div>
			<ul class="nav-list">
				{#each navItems as item}
					<li>
						<a 
							href={item.href} 
							class="nav-item"
							class:active={currentPath.startsWith(item.href)}
							on:click={closeSidebar}
							aria-current={currentPath.startsWith(item.href) ? 'page' : undefined}
						>
							<span class="nav-icon" aria-hidden="true">{item.icon}</span>
							<div class="nav-content">
								<span class="nav-label">{item.label}</span>
								<span class="nav-description">{item.description}</span>
							</div>
							{#if item.badge > 0}
								<span class="nav-badge">{item.badge}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		
		<!-- Create SmartLink CTA -->
		<div class="cta-section">
			<a href="/smartlinks/new" class="create-button" on:click={closeSidebar}>
				<span class="create-icon">➕</span>
				<span class="create-text">Créer un SmartLink</span>
			</a>
		</div>
		
		<!-- Settings navigation -->
		<nav class="nav-section">
			<div class="nav-header">Compte</div>
			<ul class="nav-list">
				{#each settingsItems as item}
					<li>
						<a 
							href={item.href} 
							class="nav-item"
							class:active={currentPath.startsWith(item.href)}
							on:click={closeSidebar}
							aria-current={currentPath.startsWith(item.href) ? 'page' : undefined}
						>
							<span class="nav-icon" aria-hidden="true">{item.icon}</span>
							<div class="nav-content">
								<span class="nav-label">{item.label}</span>
								<span class="nav-description">{item.description}</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		
		<!-- Help section -->
		<div class="help-section">
			<a href="/help" class="help-link" on:click={closeSidebar}>
				<span class="help-icon">❓</span>
				<span class="help-text">Aide & Support</span>
			</a>
		</div>
	</div>
</aside>

<!-- Mobile overlay -->
{#if $sidebar.isOpen && $responsive.isMobile}
	<div class="sidebar-overlay" on:click={sidebar.close}></div>
{/if}

<style>
	.sidebar {
		position: fixed;
		top: 64px;
		left: 0;
		width: 280px;
		height: calc(100vh - 64px);
		background: var(--pico-card-background-color);
		border-right: 1px solid var(--pico-muted-border-color);
		transform: translateX(-100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: var(--smartlink-z-fixed);
		overflow: hidden;
	}
	
	.sidebar.open {
		transform: translateX(0);
	}
	
	.sidebar.pinned {
		transform: translateX(0);
		position: relative;
		top: 0;
		height: 100%;
	}
	
	.sidebar-content {
		height: 100%;
		overflow-y: auto;
		padding: var(--smartlink-spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--smartlink-spacing-lg);
	}
	
	/* User info */
	.user-info {
		background: var(--smartlink-gray-50);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-md);
		border: 1px solid var(--smartlink-gray-200);
	}
	
	.user-details {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		margin-bottom: var(--smartlink-spacing-sm);
	}
	
	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--smartlink-primary-light);
	}
	
	.user-avatar-fallback {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--smartlink-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 1.125rem;
		border: 2px solid var(--smartlink-primary-light);
	}
	
	.user-text {
		flex: 1;
		min-width: 0;
	}
	
	.user-name {
		font-weight: 600;
		color: var(--pico-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-bottom: var(--smartlink-spacing-xs);
	}
	
	.plan-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: var(--smartlink-radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}
	
	.plan-badge.pro {
		background: var(--smartlink-success-light);
		color: var(--smartlink-success);
	}
	
	.plan-badge.free {
		background: var(--smartlink-gray-200);
		color: var(--smartlink-gray-600);
	}
	
	.usage-stats {
		margin-top: var(--smartlink-spacing-sm);
	}
	
	.usage-text {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
		margin-bottom: var(--smartlink-spacing-xs);
	}
	
	.usage-bar {
		width: 100%;
		height: 6px;
		background: var(--smartlink-gray-200);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: var(--smartlink-spacing-sm);
	}
	
	.usage-fill {
		height: 100%;
		background: var(--smartlink-primary);
		transition: width 0.3s ease;
		border-radius: 3px;
	}
	
	.upgrade-link {
		display: inline-flex;
		align-items: center;
		padding: var(--smartlink-spacing-xs) var(--smartlink-spacing-sm);
		background: var(--smartlink-primary);
		color: white;
		text-decoration: none;
		border-radius: var(--smartlink-radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		transition: all 0.15s ease;
	}
	
	.upgrade-link:hover {
		background: var(--smartlink-primary-hover);
		transform: translateY(-1px);
	}
	
	/* Navigation */
	.nav-section {
		margin-bottom: var(--smartlink-spacing-md);
	}
	
	.nav-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--pico-muted-color);
		margin-bottom: var(--smartlink-spacing-sm);
		padding: 0 var(--smartlink-spacing-sm);
	}
	
	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-md);
		text-decoration: none;
		color: var(--pico-color);
		border-radius: var(--smartlink-radius-md);
		transition: all 0.15s ease;
		margin-bottom: 2px;
		position: relative;
	}
	
	.nav-item:hover {
		background: var(--smartlink-primary-light);
		color: var(--smartlink-primary);
		transform: translateX(4px);
	}
	
	.nav-item.active {
		background: var(--smartlink-primary);
		color: white;
	}
	
	.nav-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 20px;
		background: white;
		border-radius: 0 2px 2px 0;
	}
	
	.nav-icon {
		font-size: 1.25rem;
		width: 24px;
		text-align: center;
		flex-shrink: 0;
	}
	
	.nav-content {
		flex: 1;
		min-width: 0;
	}
	
	.nav-label {
		font-weight: 500;
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.nav-description {
		font-size: 0.75rem;
		color: currentColor;
		opacity: 0.7;
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}
	
	.nav-badge {
		background: var(--smartlink-secondary);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 10px;
		min-width: 20px;
		text-align: center;
		flex-shrink: 0;
	}
	
	/* CTA Section */
	.cta-section {
		margin: var(--smartlink-spacing-md) 0;
	}
	
	.create-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--smartlink-spacing-sm);
		width: 100%;
		padding: var(--smartlink-spacing-md);
		background: var(--smartlink-primary);
		color: white;
		text-decoration: none;
		border-radius: var(--smartlink-radius-lg);
		font-weight: 600;
		transition: all 0.15s ease;
		box-shadow: var(--smartlink-shadow-md);
	}
	
	.create-button:hover {
		background: var(--smartlink-primary-hover);
		transform: translateY(-2px);
		box-shadow: var(--smartlink-shadow-lg);
	}
	
	.create-icon {
		font-size: 1.25rem;
	}
	
	.create-text {
		font-size: 0.875rem;
	}
	
	/* Help section */
	.help-section {
		margin-top: auto;
		padding-top: var(--smartlink-spacing-md);
		border-top: 1px solid var(--pico-muted-border-color);
	}
	
	.help-link {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-md);
		text-decoration: none;
		color: var(--pico-muted-color);
		border-radius: var(--smartlink-radius-md);
		transition: all 0.15s ease;
		font-size: 0.875rem;
	}
	
	.help-link:hover {
		background: var(--smartlink-gray-100);
		color: var(--smartlink-primary);
	}
	
	.help-icon {
		font-size: 1.125rem;
	}
	
	/* Mobile overlay */
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: var(--smartlink-z-modal-backdrop);
		backdrop-filter: blur(2px);
	}
	
	/* Mobile styles */
	@media (max-width: 768px) {
		.sidebar {
			top: 56px;
			height: calc(100vh - 56px);
			width: 100%;
			max-width: 320px;
		}
		
		.nav-description {
			display: none;
		}
	}
	
	/* Desktop pinned sidebar */
	@media (min-width: 1024px) {
		.sidebar {
			position: relative;
			transform: translateX(0);
			top: 0;
			height: 100%;
		}
	}
</style>