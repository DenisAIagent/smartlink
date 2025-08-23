<script>
	import { onMount } from 'svelte';
	import { createSmartLink } from '$lib/smartlinks.js';
	import { uploadAudio } from '$lib/cloudinary.js';
	
	// Form data
	let formData = {
		title: '',
		artist: '',
		description: '',
		coverUrl: '',
		previewAudioUrl: '',
		platforms: []
	};
	
	// Odesli integration
	let odesliUrl = '';
	let isLoadingOdesli = false;
	let odesliError = '';
	
	// Form state
	let isSubmitting = false;
	let currentStep = 1;
	let totalSteps = 3;
	let errors = {};
	let isUploadingAudio = false;
	
	// Available platforms
	const availablePlatforms = [
		{ name: 'Spotify', color: '#1DB954', icon: '/images/platforms/picto_spotify.png' },
		{ name: 'Apple Music', color: '#FA243C', icon: '/images/platforms/picto_applemusic.png' },
		{ name: 'YouTube Music', color: '#FF0000', icon: '/images/platforms/picto_youtubemusic.png' },
		{ name: 'Deezer', color: '#FF6600', icon: '/images/platforms/picto_deezer.png' },
		{ name: 'SoundCloud', color: '#FF5500', icon: '/images/platforms/picto_soundcloud.png' },
		{ name: 'Amazon Music', color: '#FF9900', icon: '/images/platforms/picto_amazonmusic.png' },
		{ name: 'Tidal', color: '#000000', icon: '/images/platforms/picto_tidal.png' },
		{ name: 'YouTube', color: '#FF0000', icon: '/images/platforms/picto_youtube.png' }
	];
	
	// Templates
	const templates = [
		{
			id: 'default',
			name: 'Classique',
			preview: '🎵',
			description: 'Design épuré et professionnel'
		},
		{
			id: 'modern',
			name: 'Moderne',
			preview: '✨',
			description: 'Style contemporain avec animations'
		},
		{
			id: 'artist',
			name: 'Artiste',
			preview: '🎤',
			description: 'Focus sur l\'artiste et sa personnalité'
		},
		{
			id: 'minimal',
			name: 'Minimal',
			preview: '⚪',
			description: 'Simplicité et élégance'
		}
	];
	
	let selectedTemplate = 'default';
	let customization = {
		primaryColor: '#1976d2',
		backgroundColor: '#ffffff',
		textColor: '#333333'
	};
	
	// Step navigation
	function nextStep() {
		if (validateCurrentStep()) {
			currentStep = Math.min(currentStep + 1, totalSteps);
		}
	}
	
	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}
	
	// Validation
	function validateCurrentStep() {
		errors = {};
		
		switch (currentStep) {
			case 1: // Basic info
				if (!formData.title.trim()) {
					errors.title = 'Le titre est requis';
				}
				if (formData.title.length > 100) {
					errors.title = 'Le titre ne doit pas dépasser 100 caractères';
				}
				if (formData.description && formData.description.length > 500) {
					errors.description = 'La description ne doit pas dépasser 500 caractères';
				}
				break;
				
			case 2: // Platforms
				if (formData.platforms.length === 0) {
					errors.platforms = 'Au moins une plateforme est requise';
				}
				// Validate platform URLs
				formData.platforms.forEach((platform, index) => {
					if (!platform.url || !platform.url.trim()) {
						errors[`platform_${index}`] = 'URL requise';
					} else if (!isValidUrl(platform.url)) {
						errors[`platform_${index}`] = 'URL invalide';
					}
				});
				break;
				
			case 3: // Template & customization
				// No required fields for this step
				break;
		}
		
		return Object.keys(errors).length === 0;
	}
	
	function isValidUrl(string) {
		try {
			new URL(string);
			return true;
		} catch (_) {
			return false;
		}
	}
	
	// Platform management
	function addPlatform(template) {
		formData.platforms = [...formData.platforms, {
			name: template.name,
			url: '',
			color: template.color,
			icon: template.icon
		}];
	}
	
	function removePlatform(index) {
		formData.platforms = formData.platforms.filter((_, i) => i !== index);
	}
	
	function addCustomPlatform() {
		formData.platforms = [...formData.platforms, {
			name: '',
			url: '',
			color: '#000000',
			icon: '/images/platforms/picto_spotify.png' // Default icon
		}];
	}
	
	// Audio upload handling
	async function handleAudioUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file size (10MB max)
		if (file.size > 10 * 1024 * 1024) {
			alert('❌ Le fichier audio ne doit pas dépasser 10MB.');
			return;
		}

		// Validate file type
		if (!file.type.startsWith('audio/')) {
			alert('❌ Veuillez sélectionner un fichier audio valide.');
			return;
		}

		isUploadingAudio = true;
		
		try {
			// Upload using API endpoint
			const uploadFormData = new FormData();
			uploadFormData.append('audio', file);
			
			const response = await fetch('/api/upload-audio', {
				method: 'POST',
				body: uploadFormData
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Upload failed');
			}
			
			const result = await response.json();
			formData.previewAudioUrl = result.url;
			
			alert('✅ Audio uploadé avec succès !');
		} catch (error) {
			console.error('Audio upload error:', error);
			alert('❌ Erreur lors de l\'upload de l\'audio : ' + error.message);
		} finally {
			isUploadingAudio = false;
		}
	}

	function removeAudio() {
		formData.previewAudioUrl = '';
		// Clear the file input
		const audioInput = document.getElementById('audio-file');
		if (audioInput) audioInput.value = '';
	}

	// Form submission
	async function handleSubmit() {
		if (!validateCurrentStep()) {
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Create the SmartLink using our storage system
			const smartLink = createSmartLink({
				title: formData.title,
				artist: formData.artist,
				description: formData.description,
				coverUrl: formData.coverUrl,
				previewAudioUrl: formData.previewAudioUrl,
				platforms: formData.platforms,
				template: selectedTemplate,
				customization: customization
			});
			
			// Show success message with the actual URL
			const smartLinkUrl = `${window.location.origin}/s/${smartLink.slug}`;
			alert(`🚀 SmartLink créé avec succès ! \n\nURL: ${smartLinkUrl}\n\nCliquez sur OK pour tester votre SmartLink ou annuler pour retourner au dashboard.`);
			
			// Open the SmartLink in a new tab to test it
			window.open(smartLinkUrl, '_blank');
			
			// Redirect to dashboard after a short delay
			setTimeout(() => {
				window.location.href = '/dashboard';
			}, 1000);
			
		} catch (error) {
			console.error('Create SmartLink error:', error);
			alert('❌ Erreur lors de la création du SmartLink. Veuillez réessayer.');
		} finally {
			isSubmitting = false;
		}
	}
	
	// Auto-fill demo data for testing
	function fillDemoData() {
		// Fill with a real Spotify URL that will work with Odesli
		odesliUrl = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
		
		formData = {
			title: 'Mon Nouveau Single',
			artist: 'Alex Martin',
			description: 'Découvrez mon dernier titre, disponible sur toutes les plateformes de streaming !',
			coverUrl: '',
			previewAudioUrl: '',
			platforms: [
				{
					name: 'Spotify',
					url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
					color: '#1DB954',
					icon: '/images/platforms/picto_spotify.png'
				},
				{
					name: 'Apple Music',
					url: 'https://music.apple.com/us/album/example/123456789',
					color: '#FA243C',
					icon: '/images/platforms/picto_applemusic.png'
				},
				{
					name: 'YouTube Music',
					url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
					color: '#FF0000',
					icon: '/images/platforms/picto_youtubemusic.png'
				}
			]
		};
	}

	function goToDashboard() {
		window.location.href = '/dashboard';
	}

	// Odesli API integration
	async function fetchOdesliData() {
		if (!odesliUrl.trim()) {
			odesliError = 'Veuillez entrer une URL de musique';
			return;
		}

		isLoadingOdesli = true;
		odesliError = '';

		try {
			const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(odesliUrl)}&userCountry=FR`;
			const response = await fetch(apiUrl);
			
			if (!response.ok) {
				throw new Error(`Erreur API: ${response.status}`);
			}

			const data = await response.json();
			
			// Extract main entity (usually the first one)
			const entityId = Object.keys(data.entitiesByUniqueId)[0];
			const entity = data.entitiesByUniqueId[entityId];
			
			if (!entity) {
				throw new Error('Aucune information trouvée pour cette URL');
			}

			// Auto-populate form data
			formData.title = entity.title || '';
			formData.artist = entity.artistName || '';
			formData.coverUrl = entity.thumbnailUrl || '';
			
			// Auto-generate platforms from linksByPlatform
			const platforms = [];
			const linksByPlatform = data.linksByPlatform;
			
			// Platform mapping
			const platformMapping = {
				'spotify': { name: 'Spotify', color: '#1DB954', icon: '/images/platforms/picto_spotify.png' },
				'appleMusic': { name: 'Apple Music', color: '#FA243C', icon: '/images/platforms/picto_applemusic.png' },
				'youtubeMusic': { name: 'YouTube Music', color: '#FF0000', icon: '/images/platforms/picto_youtubemusic.png' },
				'youtube': { name: 'YouTube', color: '#FF0000', icon: '/images/platforms/picto_youtube.png' },
				'deezer': { name: 'Deezer', color: '#FF6600', icon: '/images/platforms/picto_deezer.png' },
				'soundcloud': { name: 'SoundCloud', color: '#FF5500', icon: '/images/platforms/picto_soundcloud.png' },
				'amazonMusic': { name: 'Amazon Music', color: '#FF9900', icon: '/images/platforms/picto_amazonmusic.png' },
				'tidal': { name: 'Tidal', color: '#000000', icon: '/images/platforms/picto_tidal.png' }
			};

			Object.keys(linksByPlatform).forEach(platformKey => {
				const platformData = linksByPlatform[platformKey];
				const mapping = platformMapping[platformKey];
				
				if (mapping && platformData.url) {
					platforms.push({
						name: mapping.name,
						url: platformData.url,
						color: mapping.color,
						icon: mapping.icon
					});
				}
			});

			formData.platforms = platforms;
			
			// Show success message
			const platformCount = platforms.length;
			alert(`✅ Données récupérées avec succès !\n\n📀 Titre: ${entity.title}\n🎤 Artiste: ${entity.artistName}\n🔗 ${platformCount} plateformes détectées\n\nVous pouvez maintenant passer à l'étape suivante.`);

		} catch (error) {
			console.error('Odesli API error:', error);
			odesliError = error.message || 'Erreur lors de la récupération des données. Vérifiez l\'URL.';
		} finally {
			isLoadingOdesli = false;
		}
	}
</script>

<svelte:head>
	<title>Créer un SmartLink - SmartLink</title>
</svelte:head>

<div class="create-smartlink">
	<!-- Header -->
	<div class="create-header">
		<button class="back-btn" on:click={goToDashboard}>
			← Retour au dashboard
		</button>
		<div class="header-content">
			<h1>Créer un SmartLink</h1>
			<p>Votre lien intelligent sera prêt en moins de 60 secondes</p>
		</div>
		<div class="progress-bar">
			<div class="progress-fill" style="width: {(currentStep / totalSteps) * 100}%"></div>
		</div>
		<div class="step-indicator">
			Étape {currentStep} sur {totalSteps}
		</div>
	</div>
	
	<!-- Demo data button -->
	<button class="demo-btn" on:click={fillDemoData}>
		🎯 Remplir données demo
	</button>
	
	<!-- Form Steps -->
	<div class="form-container">
		
		<!-- Step 1: Basic Information -->
		{#if currentStep === 1}
			<div class="form-step">
				<div class="step-header">
					<h2>📝 Informations de base</h2>
					<p>Commençons par les informations essentielles de votre sortie</p>
				</div>

				<!-- Odesli Integration -->
				<div class="odesli-section">
					<h3>🚀 Import automatique depuis une URL</h3>
					<p>Collez l'URL de votre musique depuis Spotify, Apple Music, YouTube, etc. pour remplir automatiquement le formulaire</p>
					
					<div class="odesli-input-group">
						<input 
							type="url" 
							bind:value={odesliUrl}
							placeholder="https://open.spotify.com/track/... ou https://music.apple.com/..."
							class="odesli-input"
							class:error={odesliError}
						/>
						<button 
							type="button" 
							class="odesli-btn" 
							on:click={fetchOdesliData}
							disabled={isLoadingOdesli}
						>
							{#if isLoadingOdesli}
								🔄 Chargement...
							{:else}
								✨ Récupérer les données
							{/if}
						</button>
					</div>
					
					{#if odesliError}
						<div class="error-message">{odesliError}</div>
					{/if}

					<div class="odesli-supported">
						<small>Supports : Spotify, Apple Music, YouTube Music, Deezer, SoundCloud, Amazon Music, Tidal</small>
					</div>
				</div>

				<div class="divider">
					<span>ou remplissez manuellement</span>
				</div>
				
				<div class="form-grid">
					<div class="form-group">
						<label for="title" class="required">Titre de la sortie</label>
						<input 
							id="title"
							type="text" 
							bind:value={formData.title}
							placeholder="Ex: Mon nouveau single"
							class:error={errors.title}
							maxlength="100"
						/>
						{#if errors.title}
							<div class="error-message">{errors.title}</div>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="artist">Nom de l'artiste</label>
						<input 
							id="artist"
							type="text" 
							bind:value={formData.artist}
							placeholder="Votre nom d'artiste"
							maxlength="100"
						/>
					</div>
					
					<div class="form-group full-width">
						<label for="description">Description (optionnel)</label>
						<textarea 
							id="description"
							bind:value={formData.description}
							placeholder="Décrivez votre sortie en quelques mots..."
							rows="3"
							maxlength="500"
							class:error={errors.description}
						></textarea>
						<div class="char-count">{formData.description.length}/500</div>
						{#if errors.description}
							<div class="error-message">{errors.description}</div>
						{/if}
					</div>
					
					<div class="form-group full-width">
						<label for="cover-url">URL de l'image de couverture (optionnel)</label>
						<input 
							id="cover-url"
							type="url" 
							bind:value={formData.coverUrl}
							placeholder="https://example.com/image.jpg"
						/>
						<small>Entrez l'URL d'une image existante (JPG, PNG)</small>
					</div>
					
					<div class="form-group full-width">
						<label for="audio-file">Preview audio (30 secondes - optionnel)</label>
						<div class="audio-upload-container" class:uploading={isUploadingAudio}>
							{#if isUploadingAudio}
								<div class="upload-loading">
									<div class="spinner-small"></div>
									<p>🚀 Upload en cours vers Cloudinary...</p>
								</div>
							{:else}
								<input 
									id="audio-file"
									type="file"
									accept="audio/*"
									class="audio-input"
									on:change={handleAudioUpload}
									disabled={isUploadingAudio}
								/>
								<div class="upload-info">
									<p>📁 Formats acceptés : MP3, WAV, OGG, M4A (max 10MB)</p>
									<p>⏱️ Sera automatiquement coupé à 30 secondes</p>
								</div>
							{/if}
						</div>
						{#if formData.previewAudioUrl}
							<div class="audio-preview">
								<audio controls src={formData.previewAudioUrl}></audio>
								<button type="button" class="remove-audio" on:click={removeAudio}>
									🗑️ Supprimer l'audio
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Step 2: Platforms -->
		{#if currentStep === 2}
			<div class="form-step">
				<div class="step-header">
					<h2>🎵 Plateformes de streaming</h2>
					<p>Ajoutez les liens vers vos plateformes préférées</p>
				</div>
				
				{#if errors.platforms}
					<div class="error-banner">{errors.platforms}</div>
				{/if}
				
				<!-- Platform Templates -->
				<div class="platform-templates">
					<h3>Plateformes populaires</h3>
					<div class="template-grid">
						{#each availablePlatforms as template}
							<button 
								class="platform-template"
								on:click={() => addPlatform(template)}
							>
								<div class="template-icon" style="background-color: {template.color}20;">
									<img src={template.icon} alt={template.name} class="platform-icon-img" />
								</div>
								<span>{template.name}</span>
							</button>
						{/each}
					</div>
				</div>
				
				<!-- Added Platforms -->
				<div class="platforms-list">
					<h3>Vos plateformes ({formData.platforms.length})</h3>
					
					{#each formData.platforms as platform, index}
						<div class="platform-item">
							<div class="platform-info">
								<div 
									class="platform-icon" 
									style="background-color: {platform.color}20;"
								>
									<img src={platform.icon} alt={platform.name} class="platform-icon-img" />
								</div>
								<div class="platform-details">
									<input 
										type="text" 
										bind:value={platform.name}
										placeholder="Nom de la plateforme"
										class="platform-name"
									/>
									<input 
										type="url" 
										bind:value={platform.url}
										placeholder="https://..."
										class="platform-url"
										class:error={errors[`platform_${index}`]}
									/>
									{#if errors[`platform_${index}`]}
										<div class="error-message small">{errors[`platform_${index}`]}</div>
									{/if}
								</div>
							</div>
							<button 
								type="button"
								class="remove-platform"
								on:click={() => removePlatform(index)}
								title="Supprimer cette plateforme"
							>
								🗑️
							</button>
						</div>
					{/each}
					
					{#if formData.platforms.length === 0}
						<div class="empty-platforms">
							<p>Aucune plateforme ajoutée. Utilisez les boutons ci-dessus pour en ajouter.</p>
						</div>
					{/if}
					
					<button 
						type="button" 
						class="add-platform-btn"
						on:click={addCustomPlatform}
					>
						➕ Ajouter une plateforme personnalisée
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Step 3: Template & Customization -->
		{#if currentStep === 3}
			<div class="form-step">
				<div class="step-header">
					<h2>🎨 Design et personnalisation</h2>
					<p>Choisissez le style qui vous correspond</p>
				</div>
				
				<!-- Template Selection -->
				<div class="template-section">
					<h3>Choisissez un template</h3>
					<div class="templates-grid">
						{#each templates as template}
							<button 
								class="template-card"
								class:selected={selectedTemplate === template.id}
								on:click={() => selectedTemplate = template.id}
							>
								<div class="template-preview">
									<div class="preview-icon">{template.preview}</div>
								</div>
								<div class="template-info">
									<h4>{template.name}</h4>
									<p>{template.description}</p>
								</div>
								{#if selectedTemplate === template.id}
									<div class="selected-indicator">✓</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
				
				<!-- Customization -->
				<div class="customization-section">
					<h3>Couleurs personnalisées</h3>
					<div class="color-grid">
						<div class="color-input">
							<label for="primary-color">Couleur principale</label>
							<input 
								id="primary-color"
								type="color" 
								bind:value={customization.primaryColor}
							/>
						</div>
						<div class="color-input">
							<label for="bg-color">Arrière-plan</label>
							<input 
								id="bg-color"
								type="color" 
								bind:value={customization.backgroundColor}
							/>
						</div>
						<div class="color-input">
							<label for="text-color">Texte</label>
							<input 
								id="text-color"
								type="color" 
								bind:value={customization.textColor}
							/>
						</div>
					</div>
				</div>
				
				<!-- Preview -->
				<div class="preview-section">
					<h3>Aperçu</h3>
					<div class="smartlink-preview" 
						 style="background-color: {customization.backgroundColor}; color: {customization.textColor}">
						<div class="preview-cover">
							{#if formData.coverUrl}
								<img src={formData.coverUrl} alt="Cover" />
							{:else}
								<div class="placeholder-cover">🎵</div>
							{/if}
						</div>
						<h4 style="color: {customization.textColor}">
							{formData.title || 'Titre de votre sortie'}
						</h4>
						{#if formData.artist}
							<p>par {formData.artist}</p>
						{/if}
						{#if formData.description}
							<p class="preview-description">{formData.description}</p>
						{/if}
						<div class="preview-platforms">
							{#each formData.platforms.slice(0, 3) as platform}
								<div 
									class="preview-platform-btn"
									style="background-color: {platform.color || customization.primaryColor}"
								>
									<img src={platform.icon} alt={platform.name} class="preview-platform-icon" />
									{platform.name || 'Plateforme'}
								</div>
							{/each}
							{#if formData.platforms.length > 3}
								<div class="preview-more">+{formData.platforms.length - 3} autres</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Navigation -->
		<div class="form-navigation">
			<div class="nav-left">
				{#if currentStep > 1}
					<button type="button" class="btn-secondary" on:click={prevStep}>
						← Étape précédente
					</button>
				{/if}
			</div>
			
			<div class="nav-right">
				{#if currentStep < totalSteps}
					<button type="button" class="btn-primary" on:click={nextStep}>
						Étape suivante →
					</button>
				{:else}
					<button 
						type="button" 
						class="btn-success" 
						on:click={handleSubmit}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							🔄 Création en cours...
						{:else}
							🚀 Créer mon SmartLink
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.create-smartlink {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		background: #f8fafc;
	}
	
	/* Back button */
	.back-btn {
		background: none;
		border: 1px solid #e2e8f0;
		color: #64748b;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		margin-bottom: 1rem;
		transition: all 0.2s;
	}
	
	.back-btn:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}
	
	/* Header */
	.create-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.header-content h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.5rem;
	}
	
	.header-content p {
		color: #64748b;
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
	}
	
	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}
	
	.progress-fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 4px;
		transition: width 0.3s ease;
	}
	
	.step-indicator {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}
	
	/* Demo button */
	.demo-btn {
		background: #f59e0b;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		margin-bottom: 2rem;
		opacity: 0.9;
	}
	
	.demo-btn:hover {
		opacity: 1;
	}
	
	/* Form */
	.form-container {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		border: 1px solid #e2e8f0;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	
	.step-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.step-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.5rem;
	}
	
	.step-header p {
		color: #64748b;
		font-size: 1rem;
	}
	
	/* Odesli Integration */
	.odesli-section {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border: 1px solid #0ea5e9;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.odesli-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #0369a1;
		margin-bottom: 0.5rem;
	}

	.odesli-section p {
		color: #0c4a6e;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.odesli-input-group {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.odesli-input {
		flex: 1;
		border: 1px solid #0ea5e9;
		border-radius: 0.5rem;
		padding: 0.75rem;
		font-size: 0.875rem;
		background: white;
		transition: all 0.2s;
	}

	.odesli-input:focus {
		outline: none;
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.odesli-input.error {
		border-color: #dc2626;
	}

	.odesli-btn {
		background: linear-gradient(135deg, #0ea5e9, #0284c7);
		color: white;
		border: none;
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		font-size: 0.875rem;
	}

	.odesli-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #0284c7, #0369a1);
		transform: translateY(-1px);
	}

	.odesli-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.odesli-supported {
		text-align: center;
		margin-top: 0.5rem;
	}

	.odesli-supported small {
		color: #0c4a6e;
		font-size: 0.75rem;
		opacity: 0.7;
	}

	/* Divider */
	.divider {
		text-align: center;
		margin: 2rem 0;
		position: relative;
		color: #64748b;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e2e8f0;
		z-index: 0;
	}

	.divider span {
		background: white;
		padding: 0 1.5rem;
		position: relative;
		z-index: 1;
	}

	/* Form Elements */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.form-group.full-width {
		grid-column: 1 / -1;
	}
	
	.form-group label {
		font-weight: 500;
		color: #1e293b;
		font-size: 0.875rem;
	}
	
	.form-group label.required::after {
		content: ' *';
		color: #dc2626;
	}
	
	.form-group input,
	.form-group textarea {
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		padding: 0.75rem;
		font-size: 1rem;
		transition: border-color 0.2s;
		background: white;
	}
	
	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input.error,
	.form-group textarea.error {
		border-color: #dc2626;
	}
	
	.form-group small {
		color: #64748b;
		font-size: 0.75rem;
	}
	
	.char-count {
		text-align: right;
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 4px;
	}
	
	.error-message {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 4px;
	}
	
	.error-message.small {
		font-size: 0.75rem;
		margin-top: 2px;
	}
	
	.error-banner {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		text-align: center;
		font-weight: 500;
	}
	
	/* Platform Templates */
	.platform-templates {
		margin-bottom: 2rem;
	}
	
	.platform-templates h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
	
	.template-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.75rem;
	}
	
	.platform-template {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}
	
	.platform-template:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.template-icon {
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
	}
	
	.platform-template span {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e293b;
	}

	.platform-icon-img {
		width: 24px;
		height: 24px;
		object-fit: contain;
		border-radius: 4px;
	}

	.preview-platform-icon {
		width: 20px;
		height: 20px;
		object-fit: contain;
		border-radius: 3px;
	}
	
	/* Platforms List */
	.platforms-list h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
	
	.platform-item {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.platform-info {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		flex: 1;
	}
	
	.platform-icon {
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		flex-shrink: 0;
	}
	
	.platform-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.platform-name,
	.platform-url {
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		padding: 0.5rem;
		font-size: 0.875rem;
		background: white;
	}
	
	.platform-name:focus,
	.platform-url:focus {
		outline: none;
		border-color: #3b82f6;
	}
	
	.remove-platform {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}
	
	.remove-platform:hover {
		background: #fef2f2;
	}
	
	.empty-platforms {
		text-align: center;
		padding: 2rem;
		color: #64748b;
		background: #f8fafc;
		border-radius: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.add-platform-btn {
		background: none;
		border: 1px dashed #3b82f6;
		color: #3b82f6;
		border-radius: 0.75rem;
		padding: 1rem;
		width: 100%;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.add-platform-btn:hover {
		background: #f0f9ff;
	}
	
	/* Templates */
	.template-section {
		margin-bottom: 2rem;
	}
	
	.template-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
	
	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	
	.template-card {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		text-align: left;
	}
	
	.template-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.template-card.selected {
		border-color: #3b82f6;
		background: #f0f9ff;
	}
	
	.template-preview {
		margin-bottom: 1rem;
	}
	
	.preview-icon {
		font-size: 2rem;
	}
	
	.template-info h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}
	
	.template-info p {
		font-size: 0.875rem;
		color: #64748b;
		line-height: 1.4;
	}
	
	.selected-indicator {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 24px;
		height: 24px;
		background: #3b82f6;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	/* Customization */
	.customization-section {
		margin-bottom: 2rem;
	}
	
	.customization-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
	
	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}
	
	.color-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.color-input label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e293b;
	}
	
	.color-input input[type="color"] {
		width: 100%;
		height: 40px;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		background: none;
	}
	
	/* Preview */
	.preview-section {
		margin-top: 2rem;
	}
	
	.preview-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
	
	.smartlink-preview {
		max-width: 300px;
		margin: 0 auto;
		padding: 2rem;
		border-radius: 1rem;
		text-align: center;
		border: 1px solid #e2e8f0;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	
	.preview-cover {
		width: 120px;
		height: 120px;
		margin: 0 auto 1.5rem;
		border-radius: 0.75rem;
		overflow: hidden;
	}
	
	.preview-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.placeholder-cover {
		width: 100%;
		height: 100%;
		background: #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
	}
	
	.smartlink-preview h4 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	
	.smartlink-preview p {
		margin-bottom: 0.5rem;
		opacity: 0.8;
	}
	
	.preview-description {
		font-size: 0.875rem;
		line-height: 1.4;
		margin-bottom: 1.5rem !important;
	}
	
	.preview-platforms {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.preview-platform-btn {
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	
	.preview-more {
		padding: 0.5rem;
		color: #64748b;
		font-size: 0.75rem;
		text-align: center;
	}
	
	/* Navigation */
	.form-navigation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
		margin-top: 2rem;
	}
	
	.nav-left,
	.nav-right {
		display: flex;
		gap: 1rem;
	}
	
	/* Buttons */
	.btn-primary,
	.btn-secondary,
	.btn-success {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 0.875rem;
	}
	
	.btn-primary {
		background: #3b82f6;
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}
	
	.btn-secondary {
		background: none;
		color: #3b82f6;
		border: 1px solid #3b82f6;
	}
	
	.btn-secondary:hover {
		background: #3b82f6;
		color: white;
	}
	
	.btn-success {
		background: #10b981;
		color: white;
		font-size: 1rem;
		padding: 0.875rem 2rem;
	}
	
	.btn-success:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	
	.btn-success:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Audio Upload Styles */
	.audio-upload-container {
		background: #f8fafc;
		border: 1px dashed #cbd5e1;
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.2s;
	}

	.audio-upload-container:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
	}

	.audio-input {
		width: 100%;
		margin-bottom: 1rem;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
	}

	.upload-info {
		margin-top: 0.75rem;
	}

	.upload-info p {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0.25rem 0;
	}

	.audio-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: space-between;
	}

	.audio-preview audio {
		flex: 1;
		max-width: 300px;
	}

	.remove-audio {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.remove-audio:hover {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.audio-upload-container.uploading {
		border-color: #3b82f6;
		background: #f0f9ff;
	}

	.upload-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.upload-loading p {
		color: #3b82f6;
		font-weight: 500;
		margin: 0;
	}

	.spinner-small {
		width: 24px;
		height: 24px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.create-smartlink {
			padding: 1rem;
		}
		
		.form-container {
			padding: 1.5rem;
		}
		
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.template-grid {
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		}
		
		.templates-grid {
			grid-template-columns: 1fr;
		}
		
		.color-grid {
			grid-template-columns: 1fr;
		}
		
		.form-navigation {
			flex-direction: column;
			gap: 1rem;
		}
		
		.nav-left,
		.nav-right {
			width: 100%;
		}
		
		.nav-right .btn-primary,
		.nav-right .btn-success {
			width: 100%;
		}
		
		.platform-item {
			flex-direction: column;
			gap: 1rem;
		}
		
		.platform-info {
			width: 100%;
		}

		.odesli-input-group {
			flex-direction: column;
		}

		.odesli-btn {
			width: 100%;
		}
	}
</style>