<script>
	import { onMount } from 'svelte';
	
	let email = '';
	let password = '';
	let isLogin = true;
	let loading = false;
	let error = '';

	// Faux identifiants pour test
	const FAKE_CREDENTIALS = {
		'denis@mdmcmusicads.com': 'Printani@001',
		'artiste@smartlink.fr': 'artiste123',
		'marie.dubois@gmail.com': 'marie123',
		'admin@smartlink.fr': 'admin123'
	};

	function toggleMode() {
		isLogin = !isLogin;
		error = '';
	}

	function handleSubmit() {
		loading = true;
		error = '';
		
		console.log('Tentative de connexion:', { email, password });
		console.log('Identifiants disponibles:', Object.keys(FAKE_CREDENTIALS));
		
		setTimeout(() => {
			if (isLogin) {
				// Vérifier les identifiants
				console.log('Vérification:', email, 'attendu:', FAKE_CREDENTIALS[email], 'reçu:', password);
				if (FAKE_CREDENTIALS[email] === password) {
					console.log('✅ Connexion réussie');
					alert(`✅ Connexion réussie ! Bienvenue ${email}`);
					// Redirection vers le dashboard
					window.location.href = '/dashboard';
				} else {
					console.log('❌ Échec de connexion');
					error = `❌ Email ou mot de passe incorrect. Email: "${email}", essayez: denis@mdmcmusicads.com`;
				}
			} else {
				// Inscription simulée
				alert(`✅ Inscription réussie ! Bienvenue ${email}`);
				// Auto-switch to login mode after signup
				isLogin = true;
			}
			loading = false;
		}, 1000);
	}

	function useDemo(demoEmail, demoPassword) {
		email = demoEmail;
		password = demoPassword;
		isLogin = true;
	}
</script>

<svelte:head>
	<title>{isLogin ? 'Connexion' : 'Inscription'} - SmartLink</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-header">
			<div class="logo">
				<span class="logo-icon">🎵</span>
				<span class="logo-text">SmartLink</span>
			</div>
			<h1>{isLogin ? 'Bon retour !' : 'Créer un compte'}</h1>
			<p>{isLogin ? 'Connectez-vous pour gérer vos liens musicaux' : 'Rejoignez les artistes qui révolutionnent leurs liens'}</p>
		</div>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="auth-form">
			<div class="form-group">
				<label for="email">Email</label>
				<input 
					type="email" 
					id="email" 
					bind:value={email}
					placeholder="votre@email.com"
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">Mot de passe</label>
				<input 
					type="password" 
					id="password" 
					bind:value={password}
					placeholder="••••••••"
					required
				/>
			</div>

			{#if !isLogin}
				<div class="form-group">
					<label for="confirm-password">Confirmer le mot de passe</label>
					<input 
						type="password" 
						id="confirm-password" 
						placeholder="••••••••"
						required
					/>
				</div>
			{/if}

			<button type="submit" class="auth-button primary" disabled={loading}>
				{#if loading}
					<span class="spinner"></span>
					Chargement...
				{:else}
					{isLogin ? 'Se connecter' : 'Créer mon compte'}
				{/if}
			</button>
		</form>

		<div class="auth-divider">
			<span>ou</span>
		</div>

		<div class="oauth-buttons">
			<button class="oauth-button google">
				<span class="oauth-icon">🔍</span>
				Continuer avec Google
			</button>
			<button class="oauth-button spotify">
				<span class="oauth-icon">🎵</span>
				Continuer avec Spotify
			</button>
		</div>


		<div class="auth-footer">
			<p>
				{isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
				<button type="button" on:click={toggleMode} class="link-button">
					{isLogin ? "S'inscrire" : "Se connecter"}
				</button>
			</p>
		</div>

		{#if isLogin}
			<div class="forgot-password">
				<a href="/forgot-password" class="text-link">Mot de passe oublié ?</a>
			</div>
		{/if}
	</div>

	<div class="auth-features">
		<div class="feature-item">
			<span class="feature-icon">⚡</span>
			<span>Création en moins de 60s</span>
		</div>
		<div class="feature-item">
			<span class="feature-icon">🇫🇷</span>
			<span>Service 100% français</span>
		</div>
		<div class="feature-item">
			<span class="feature-icon">💰</span>
			<span>À partir de 8€/mois</span>
		</div>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		position: relative;
	}

	.auth-card {
		background: white;
		border-radius: 1rem;
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		margin-bottom: 2rem;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.logo-icon {
		font-size: 2rem;
	}

	.logo-text {
		font-size: 1.5rem;
		font-weight: 700;
		color: #3b82f6;
	}

	.auth-header h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.auth-header p {
		color: #6b7280;
		margin: 0;
	}

	.auth-form {
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
		background: white;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.auth-button {
		width: 100%;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.auth-button.primary {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
	}

	.auth-button.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.auth-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.auth-divider {
		text-align: center;
		margin: 1.5rem 0;
		position: relative;
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.auth-divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e5e7eb;
		z-index: 0;
	}

	.auth-divider span {
		background: white;
		padding: 0 1rem;
		position: relative;
		z-index: 1;
	}

	.oauth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.oauth-button {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.oauth-button:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	.oauth-button.google:hover {
		border-color: #4285f4;
	}

	.oauth-button.spotify:hover {
		border-color: #1db954;
	}

	.oauth-icon {
		font-size: 1.125rem;
	}

	.auth-footer {
		text-align: center;
	}

	.auth-footer p {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	.link-button {
		background: none;
		border: none;
		color: #3b82f6;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
	}

	.link-button:hover {
		color: #2563eb;
	}

	.forgot-password {
		text-align: center;
		margin-top: 1rem;
	}

	.text-link {
		color: #3b82f6;
		font-size: 0.875rem;
		text-decoration: none;
	}

	.text-link:hover {
		text-decoration: underline;
		color: #2563eb;
	}

	.auth-features {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		max-width: 600px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		backdrop-filter: blur(10px);
	}

	.feature-icon {
		font-size: 1rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.auth-card {
			padding: 2rem;
			margin: 1rem;
		}
		
		.auth-features {
			flex-direction: column;
			align-items: center;
		}
		
		.feature-item {
			width: 100%;
			justify-content: center;
		}
	}

	/* Error message */
	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	/* Demo section */
	.demo-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 1.5rem 0;
	}

	.demo-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #475569;
		justify-content: center;
	}

	.demo-icon {
		font-size: 1rem;
	}

	.demo-accounts {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.demo-account {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.demo-account:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
	}

	.demo-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.demo-email {
		font-size: 0.75rem;
		font-weight: 600;
		color: #1e293b;
	}

	.demo-label {
		font-size: 0.625rem;
		color: #64748b;
	}
</style>