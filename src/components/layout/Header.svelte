<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore, isAuthenticated } from '../../stores/auth.js';
	import { theme, sidebar, notifications } from '../../stores/ui.js';
	
	// Reactive variables
	$: user = $authStore.user;
	$: currentPath = $page.url.pathname;
	
	// Navigation items
	const navItems = [
		{ href: '/dashboard', label: 'Tableau de bord', icon: '🏠' },
		{ href: '/smartlinks', label: 'SmartLinks', icon: '🔗' },
		{ href: '/analytics', label: 'Analytics', icon: '📊' },
		{ href: '/templates', label: 'Templates', icon: '🎨' }
	];
	
	// Handle sign out
	async function handleSignOut() {
		const result = await authStore.signOut();
		if (result.success) {
			notifications.success('Déconnexion réussie');
			goto('/');
		} else {
			notifications.error('Erreur lors de la déconnexion');
		}
	}
	
	// Toggle theme
	function toggleTheme() {
		theme.toggle();
	}
	
	// Toggle sidebar on mobile
	function toggleSidebar() {
		sidebar.toggle();
	}
</script>

<header class="header french-accent">
	<div class="header-content">
		<!-- Logo and brand -->
		<div class="brand">
			<button class="sidebar-toggle" on:click={toggleSidebar} aria-label="Toggle sidebar">
				<span class="hamburger-icon">
					<span></span>
					<span></span>
					<span></span>
				</span>
			</button>
			
			<a href="/dashboard" class="logo">
				<span class="logo-icon">🔗</span>
				<span class="logo-text">SmartLink</span>
			</a>
		</div>
		
		<!-- Main navigation -->
		<nav class="main-nav" aria-label="Navigation principale">
			{#each navItems as item}
				<a 
					href={item.href} 
					class="nav-link"
					class:active={currentPath.startsWith(item.href)}
					aria-current={currentPath.startsWith(item.href) ? 'page' : undefined}
				>
					<span class="nav-icon" aria-hidden="true">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>
		
		<!-- User actions -->
		<div class="user-actions">
			<!-- Theme toggle -->
			<button 
				class="icon-button" 
				on:click={toggleTheme}
				aria-label="Changer de thème"
				title="Changer de thème"
			>
				{#if $theme === 'dark'}
					☀️
				{:else}
					🌙
				{/if}
			</button>
			
			<!-- User menu -->
			{#if $isAuthenticated}
				<div class="user-menu">
					<button class="user-button" aria-label="Menu utilisateur">
						{#if user?.photoURL}
							<img src={user.photoURL} alt="Avatar" class="user-avatar" />
						{:else}
							<div class="user-avatar-fallback">
								{user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
							</div>
						{/if}
						<span class="user-name">{user?.displayName || 'Utilisateur'}</span>
					</button>
					
					<div class="dropdown-menu">
						<a href="/profile" class="dropdown-item">
							<span class="dropdown-icon">👤</span>
							Profil
						</a>
						<a href="/settings" class="dropdown-item">
							<span class="dropdown-icon">⚙️</span>
							Paramètres
						</a>
						<hr class="dropdown-divider" />
						<button class="dropdown-item" on:click={handleSignOut}>
							<span class="dropdown-icon">🚪</span>
							Déconnexion
						</button>
					</div>
				</div>
			{:else}
				<a href="/login" class="login-button">
					Se connecter
				</a>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		background: var(--pico-card-background-color);
		border-bottom: 1px solid var(--pico-muted-border-color);
		padding: 0 var(--smartlink-spacing-md);
		position: sticky;
		top: 0;
		z-index: var(--smartlink-z-sticky);
		backdrop-filter: blur(8px);
		transition: all 0.15s ease;
	}
	
	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		margin: 0 auto;
		height: 64px;
	}
	
	.brand {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-md);
	}
	
	.sidebar-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--smartlink-spacing-xs);
		border-radius: var(--smartlink-radius-sm);
		transition: background-color 0.15s ease;
	}
	
	.sidebar-toggle:hover {
		background: var(--smartlink-gray-100);
	}
	
	.hamburger-icon {
		display: flex;
		flex-direction: column;
		gap: 3px;
		width: 20px;
	}
	
	.hamburger-icon span {
		height: 2px;
		background: var(--pico-color);
		border-radius: 1px;
		transition: all 0.3s ease;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		text-decoration: none;
		color: var(--pico-color);
		font-weight: 600;
		font-size: 1.25rem;
	}
	
	.logo-icon {
		font-size: 1.5rem;
	}
	
	.logo-text {
		color: var(--smartlink-primary);
	}
	
	.main-nav {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
	}
	
	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-xs);
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-md);
		text-decoration: none;
		color: var(--pico-muted-color);
		border-radius: var(--smartlink-radius-md);
		transition: all 0.15s ease;
		font-weight: 500;
		font-size: 0.875rem;
	}
	
	.nav-link:hover {
		color: var(--smartlink-primary);
		background: var(--smartlink-primary-light);
		transform: translateY(-1px);
	}
	
	.nav-link.active {
		color: var(--smartlink-primary);
		background: var(--smartlink-primary-light);
		font-weight: 600;
	}
	
	.nav-icon {
		font-size: 1rem;
	}
	
	.user-actions {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-md);
	}
	
	.icon-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--smartlink-spacing-sm);
		border-radius: var(--smartlink-radius-md);
		font-size: 1.25rem;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.icon-button:hover {
		background: var(--smartlink-gray-100);
		transform: scale(1.1);
	}
	
	.user-menu {
		position: relative;
	}
	
	.user-button {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		background: none;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		padding: var(--smartlink-spacing-xs) var(--smartlink-spacing-sm);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.user-button:hover {
		border-color: var(--smartlink-primary);
		background: var(--smartlink-primary-light);
	}
	
	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.user-avatar-fallback {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--smartlink-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.user-name {
		font-weight: 500;
		color: var(--pico-color);
	}
	
	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--smartlink-spacing-xs));
		right: 0;
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--smartlink-radius-lg);
		box-shadow: var(--smartlink-shadow-lg);
		min-width: 200px;
		padding: var(--smartlink-spacing-sm);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-10px);
		transition: all 0.15s ease;
		z-index: var(--smartlink-z-dropdown);
	}
	
	.user-menu:hover .dropdown-menu {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}
	
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--smartlink-spacing-sm);
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-md);
		text-decoration: none;
		color: var(--pico-color);
		border-radius: var(--smartlink-radius-md);
		transition: all 0.15s ease;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
	}
	
	.dropdown-item:hover {
		background: var(--smartlink-gray-100);
		color: var(--smartlink-primary);
	}
	
	.dropdown-icon {
		font-size: 1rem;
	}
	
	.dropdown-divider {
		margin: var(--smartlink-spacing-sm) 0;
		border: none;
		border-top: 1px solid var(--pico-muted-border-color);
	}
	
	.login-button {
		padding: var(--smartlink-spacing-sm) var(--smartlink-spacing-lg);
		background: var(--smartlink-primary);
		color: white;
		text-decoration: none;
		border-radius: var(--smartlink-radius-md);
		font-weight: 500;
		transition: all 0.15s ease;
	}
	
	.login-button:hover {
		background: var(--smartlink-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--smartlink-shadow-md);
	}
	
	/* Mobile styles */
	@media (max-width: 768px) {
		.sidebar-toggle {
			display: block;
		}
		
		.main-nav {
			display: none;
		}
		
		.nav-label {
			display: none;
		}
		
		.user-name {
			display: none;
		}
		
		.header {
			padding: 0 var(--smartlink-spacing-sm);
		}
		
		.header-content {
			height: 56px;
		}
	}
	
	/* Tablet styles */
	@media (max-width: 1024px) {
		.nav-label {
			display: none;
		}
		
		.main-nav {
			gap: var(--smartlink-spacing-xs);
		}
	}
</style>