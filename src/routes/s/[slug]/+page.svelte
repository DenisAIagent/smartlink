<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getSmartLink } from '$lib/smartlinks.js';
	
	// Get slug from URL
	$: slug = $page.params.slug;
	
	// Component state
	let smartLink = null;
	let loading = true;
	let error = null;
	let isPlaying = false;
	let audioElement = null;
	
	// Load SmartLink data
	onMount(async () => {
		if (!slug) {
			error = 'Lien invalide';
			loading = false;
			return;
		}
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Get SmartLink from storage
			smartLink = getSmartLink(slug);
			
			if (!smartLink) {
				error = 'SmartLink introuvable';
				loading = false;
				return;
			}
			
			loading = false;
		} catch (err) {
			console.error('Error loading SmartLink:', err);
			error = 'Erreur lors du chargement';
			loading = false;
		}
	});
	
	// Handle platform click
	function openService(platform) {
		if (platform?.url) {
			// Animation de feedback
			const serviceItem = event.currentTarget;
			serviceItem.style.transform = 'scale(0.98)';
			setTimeout(() => {
				serviceItem.style.transform = 'translateY(-1px)';
			}, 100);
			
			// Tracking
			console.log('Opening platform:', platform.name, platform.url);
			
			// Ouvrir le lien
			window.open(platform.url, '_blank');
		}
	}
	
	// Play album function
	function playAlbum() {
		console.log('Playing album...');
		
		// Animation du bouton play
		const playBtn = document.querySelector('.play-button');
		if (playBtn) {
			playBtn.style.transform = 'scale(0.95)';
			setTimeout(() => {
				playBtn.style.transform = 'scale(1)';
			}, 150);
		}
		
		// Si il y a un preview audio, le jouer
		if (smartLink?.previewAudioUrl) {
			toggleAudioPreview();
		} else {
			// Sinon, ouvrir la première plateforme disponible
			if (smartLink?.platforms?.length > 0) {
				openService(smartLink.platforms[0]);
			}
		}
	}

	// Toggle audio preview
	function toggleAudioPreview() {
		if (!audioElement) {
			audioElement = document.querySelector('#preview-audio');
		}
		
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
			isPlaying = false;
		} else {
			audioElement.play();
			isPlaying = true;
		}
	}

	// Audio event handlers
	function handleAudioPlay() {
		isPlaying = true;
	}

	function handleAudioPause() {
		isPlaying = false;
	}

	function handleAudioEnded() {
		isPlaying = false;
	}
	
	// Get platform icon (use actual images)
	function getPlatformIcon(platform) {
		// Return the actual platform icon path
		return platform.icon || '/images/platforms/picto_spotify.png';
	}
	
	// Get platform class
	function getPlatformClass(platformName) {
		const classes = {
			'Spotify': 'spotify',
			'Apple Music': 'apple-music',
			'YouTube Music': 'youtube-music',
			'YouTube': 'youtube-music',
			'Deezer': 'deezer',
			'SoundCloud': 'soundcloud',
			'Tidal': 'tidal',
			'Amazon Music': 'amazon-music'
		};
		return classes[platformName] || 'default';
	}
	
	// Get platform description
	function getPlatformDescription(platformName) {
		const descriptions = {
			'Spotify': 'Music for everyone',
			'Apple Music': 'Music everywhere',
			'YouTube Music': 'Music videos & more',
			'YouTube': 'Music videos & more',
			'Deezer': 'Flow your music',
			'SoundCloud': 'Hear what\'s next',
			'Tidal': 'High fidelity',
			'Amazon Music': 'Stream music'
		};
		return descriptions[platformName] || 'Listen now';
	}
	
	// Background image is now handled in the template with reactive blocks
</script>

<svelte:head>
	{#if smartLink}
		<title>{smartLink.title} - {smartLink.artist || 'SmartLink'}</title>
		<meta name="description" content="{smartLink.description || `Écoutez ${smartLink.title} sur toutes les plateformes`}" />
		<meta property="og:title" content="{smartLink.title}" />
		<meta property="og:description" content="{smartLink.description || `Écoutez ${smartLink.title} sur toutes les plateformes`}" />
		{#if smartLink.coverUrl}
			<meta property="og:image" content="{smartLink.coverUrl}" />
		{/if}
		<meta property="og:url" content="https://mdmcmusicads.com/s/{slug}" />
		<meta property="og:type" content="music.song" />
	{:else}
		<title>SmartLink - Liens Intelligents</title>
	{/if}
</svelte:head>

<div class="smartlink-page">
	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p>Chargement...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<h1>❌ {error}</h1>
			<p>Ce SmartLink n'existe pas ou n'est plus disponible.</p>
			<a href="/" class="back-link">← Retour à l'accueil</a>
		</div>
	{:else if smartLink}
		<div class="music-card">
			<div class="album-container">
				<div class="album-cover" style={smartLink.coverUrl ? `background-image: url('${smartLink.coverUrl}')` : ''}>
					<div class="play-button" on:click={playAlbum}>
						{#if isPlaying}
							<div class="pause-icon"></div>
						{:else}
							<div class="play-icon"></div>
						{/if}
					</div>
				</div>
			</div>
			
			<h1 class="title">{smartLink.title}</h1>
			{#if smartLink.artist}
				<p class="subtitle">{smartLink.artist}</p>
			{/if}
			<p class="choose-service">Choose music service</p>
			
			<div class="services-list">
				{#each smartLink.platforms as platform}
					<div class="service-item" on:click={() => openService(platform)}>
						<div class="service-icon {getPlatformClass(platform.name)}">
							<img src={getPlatformIcon(platform)} alt={platform.name} class="platform-icon-img" />
						</div>
						<div class="service-info">
							<div class="service-name">{platform.name}</div>
							<div class="service-description">{getPlatformDescription(platform.name)}</div>
						</div>
						<button class="play-btn">Play</button>
					</div>
				{/each}
			</div>
			
			{#if smartLink.description}
				<div class="description">
					<p>{smartLink.description}</p>
				</div>
			{/if}
			
			<!-- Hidden audio element for preview -->
			{#if smartLink.previewAudioUrl}
				<audio
					id="preview-audio"
					src={smartLink.previewAudioUrl}
					on:play={handleAudioPlay}
					on:pause={handleAudioPause}
					on:ended={handleAudioEnded}
					style="display: none;"
				></audio>
			{/if}
		</div>
	{/if}
	
	<!-- Background layers -->
	<div class="bg-gradient"></div>
	<div class="bg-effects"></div>
	{#if smartLink?.coverUrl}
		<div class="bg-image" style="background-image: url('{smartLink.coverUrl}')"></div>
	{/if}
</div>

<style>
	.smartlink-page {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		overflow: auto;
	}

	.bg-gradient {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #2c1810 0%, #4a2c1a 50%, #6b3d28 100%);
		z-index: -3;
	}

	.bg-effects {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: radial-gradient(circle at 30% 20%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
						radial-gradient(circle at 70% 80%, rgba(160, 82, 45, 0.2) 0%, transparent 50%),
						radial-gradient(circle at 40% 40%, rgba(210, 180, 140, 0.1) 0%, transparent 50%);
		filter: blur(40px);
		z-index: -2;
	}

	.bg-image {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		filter: blur(60px) brightness(0.3);
		z-index: -1;
		opacity: 0.8;
	}

	.music-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 24px;
		padding: 32px;
		width: 100%;
		max-width: 380px;
		max-height: calc(100vh - 40px);
		overflow-y: auto;
		box-shadow: 
			0 25px 50px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		position: relative;
		z-index: 1;
		transform: translateY(20px);
		opacity: 0;
		animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: 0.1s;
	}

	@keyframes slideUp {
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.album-container {
		position: relative;
		width: 140px;
		height: 140px;
		margin: 0 auto 24px;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.album-cover {
		width: 100%;
		height: 100%;
		background: linear-gradient(45deg, #8B0000, #DC143C, #B22222);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.album-cover::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%);
	}

	.play-button {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1;
	}

	.play-button:hover {
		transform: scale(1.05);
		background: white;
	}

	.play-icon {
		width: 0;
		height: 0;
		border-left: 14px solid #333;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		margin-left: 3px;
	}

	.pause-icon {
		width: 14px;
		height: 16px;
		display: flex;
		gap: 4px;
	}

	.pause-icon::before,
	.pause-icon::after {
		content: '';
		width: 3px;
		height: 16px;
		background: #333;
		border-radius: 1px;
	}

	.title {
		text-align: center;
		font-size: 28px;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 8px;
		letter-spacing: -0.5px;
	}

	.subtitle {
		text-align: center;
		font-size: 18px;
		color: #666;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.choose-service {
		text-align: center;
		font-size: 16px;
		color: #8e8e93;
		margin-bottom: 32px;
		font-weight: 400;
	}

	.services-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
	}

	.service-item {
		display: flex;
		align-items: center;
		padding: 16px;
		border-radius: 16px;
		background: rgba(248, 248, 248, 0.8);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.service-item:hover {
		background: rgba(240, 240, 240, 0.9);
		transform: translateY(-1px);
	}

	.service-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		margin-right: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: white;
		font-size: 14px;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	/* Backgrounds transparents pour les icônes PNG */
	.spotify, .apple-music, .youtube-music, .tidal, .deezer, .soundcloud, .amazon-music, .default { 
		background: transparent; 
	}

	.platform-icon-img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		border-radius: 6px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}

	.service-info {
		flex: 1;
	}

	.service-name {
		font-size: 17px;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2px;
	}

	.service-description {
		font-size: 14px;
		color: #8e8e93;
		font-weight: 400;
	}

	.play-btn {
		background: #007AFF;
		color: white;
		border: none;
		padding: 8px 20px;
		border-radius: 20px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.play-btn:hover {
		background: #0056CC;
		transform: scale(1.02);
	}

	.play-btn:active {
		transform: scale(0.98);
	}

	.description {
		text-align: center;
		padding: 16px 0;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		margin-top: 8px;
	}

	.description p {
		color: #666;
		font-size: 14px;
		line-height: 1.4;
		margin: 0;
	}

	/* Loading et Error states */
	.loading-container, .error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: white;
		padding: 2rem;
		z-index: 1;
		position: relative;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.back-link {
		color: #007AFF;
		text-decoration: none;
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid #007AFF;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.back-link:hover {
		background: #007AFF;
		color: white;
	}

	@media (max-width: 480px) {
		.music-card {
			padding: 24px;
			margin: 10px;
		}
		
		.album-container {
			width: 120px;
			height: 120px;
		}

		.title {
			font-size: 24px;
		}
	}
</style>