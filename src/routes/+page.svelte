<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>SmartLink - Liens Intelligents pour Artistes Français</title>
	<meta name="description" content="Service de liens intelligents pour artistes indépendants français. Simple, rapide et abordable." />
	<meta property="og:title" content="SmartLink - Révolutionnez vos liens musicaux" />
	<meta property="og:description" content="Créez des liens intelligents en moins de 60 secondes. 8€/mois seulement." />
	<meta property="og:type" content="website" />
	<link rel="canonical" href="https://smartlink.fr" />
</svelte:head>

<div class="landing-page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<div class="hero-badge">
				🇫🇷 Conçu pour les artistes français
			</div>
			<h1 class="hero-title">
				Créez des liens intelligents 
				<span class="text-gradient">en moins de 60 secondes</span>
			</h1>
			<p class="hero-description">
				Le premier service SmartLink français. Redirigez intelligemment vos fans vers Spotify, Apple Music, Deezer et plus encore.
				Simple, rapide, et conçu pour les artistes indépendants français.
			</p>
			<div class="hero-stats">
				<div class="stat">
					<div class="stat-number">&lt; 60s</div>
					<div class="stat-label">Création d'un lien</div>
				</div>
				<div class="stat">
					<div class="stat-number">8€/mois</div>
					<div class="stat-label">Prix imbattable</div>
				</div>
				<div class="stat">
					<div class="stat-number">12+ plateformes</div>
					<div class="stat-label">Supportées</div>
				</div>
			</div>
			<div class="hero-actions">
				<a href="/auth" class="cta-button primary">
					Commencer gratuitement
					<span class="button-arrow">→</span>
				</a>
				<button class="cta-button secondary">
					Voir la démo
					<span class="play-icon">▶</span>
				</button>
			</div>
		</div>
		<div class="hero-visual">
			<div class="mockup-container">
				<div class="phone-mockup">
					<div class="phone-screen">
						<div class="smartlink-preview">
							<div class="preview-header">
								<div class="artist-avatar"></div>
								<div class="artist-info">
									<div class="artist-name">Nom Artiste</div>
									<div class="track-title">Nouveau Single</div>
								</div>
							</div>
							<div class="platform-buttons">
								<div class="platform-btn spotify">Spotify</div>
								<div class="platform-btn apple">Apple Music</div>
								<div class="platform-btn deezer">Deezer</div>
								<div class="platform-btn youtube">YouTube</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features">
		<div class="container">
			<div class="section-header">
				<h2>Pourquoi choisir SmartLink ?</h2>
				<p>Tout ce dont vous avez besoin pour gérer vos liens musicaux efficacement.</p>
			</div>
			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon">⚡</div>
					<h3>Ultra-rapide</h3>
					<p>Créez votre premier lien en moins de 60 secondes. Interface optimisée mobile-first.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon">🇫🇷</div>
					<h3>100% Français</h3>
					<p>Templates adaptés au marché français, support en français, données hébergées en Europe.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon">💰</div>
					<h3>Prix imbattable</h3>
					<p>À partir de 8€/mois, soit 47% moins cher que Linkfire. Plan gratuit disponible.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon">📊</div>
					<h3>Analytics précises</h3>
					<p>Suivez vos performances avec des statistiques géolocalisées et temps réel.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon">🎨</div>
					<h3>Templates exclusifs</h3>
					<p>5 templates français prêts à l'emploi + personnalisation complète de votre marque.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon">📱</div>
					<h3>Mobile-optimisé</h3>
					<p>Performance exceptionnelle sur mobile, PWA, et interface conçue pour utilisation tactile.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Social Proof -->
	<section class="social-proof">
		<div class="container">
			<div class="section-header">
				<h2>Ils nous font confiance</h2>
				<p>Rejoignez les artistes français qui révolutionnent leur promotion musicale.</p>
			</div>
			<div class="testimonials">
				<div class="testimonial-card">
					<div class="testimonial-content">
						"SmartLink a révolutionné ma façon de partager ma musique. Interface claire, analytics précises, et surtout un prix accessible pour les indépendants !"
					</div>
					<div class="testimonial-author">
						<div class="author-avatar"></div>
						<div class="author-info">
							<div class="author-name">Marie Dubois</div>
							<div class="author-role">Artiste indépendante, Lyon</div>
						</div>
					</div>
				</div>
				<div class="testimonial-card">
					<div class="testimonial-content">
						"Enfin un service pensé pour le marché français ! Les templates sont parfaits et le support client réactif. Je recommande à 100%."
					</div>
					<div class="testimonial-author">
						<div class="author-avatar"></div>
						<div class="author-info">
							<div class="author-name">Thomas Martin</div>
							<div class="author-role">Manager, Paris</div>
						</div>
					</div>
				</div>
				<div class="testimonial-card">
					<div class="testimonial-content">
						"La création de liens en moins d'une minute, c'est exactement ce dont j'avais besoin pour mes sorties impromptues. Parfait !"
					</div>
					<div class="testimonial-author">
						<div class="author-avatar"></div>
						<div class="author-info">
							<div class="author-name">Alex Petit</div>
							<div class="author-role">Rappeur, Marseille</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing -->
	<section class="pricing">
		<div class="container">
			<div class="section-header">
				<h2>Tarifs transparents</h2>
				<p>Choisissez le plan qui correspond à vos besoins. Sans engagement, changez quand vous voulez.</p>
			</div>
			<div class="pricing-grid">
				<div class="pricing-card">
					<div class="plan-name">Gratuit</div>
					<div class="plan-price">
						<span class="price">0€</span>
						<span class="period">/mois</span>
					</div>
					<ul class="plan-features">
						<li>3 SmartLinks maximum</li>
						<li>3 templates basiques</li>
						<li>Analytics 30 jours</li>
						<li>Support communautaire</li>
					</ul>
					<a href="/auth?plan=free" class="plan-button secondary">Commencer</a>
				</div>
				<div class="pricing-card featured">
					<div class="plan-badge">Le plus populaire</div>
					<div class="plan-name">Pro</div>
					<div class="plan-price">
						<span class="price">8€</span>
						<span class="period">/mois</span>
					</div>
					<ul class="plan-features">
						<li>SmartLinks illimités</li>
						<li>20+ templates premium</li>
						<li>Analytics complètes</li>
						<li>Personnalisation avancée</li>
						<li>Support prioritaire</li>
						<li>Export des données</li>
					</ul>
					<a href="/auth?plan=pro" class="plan-button primary">Choisir Pro</a>
				</div>
				<div class="pricing-card">
					<div class="plan-name">Label</div>
					<div class="plan-price">
						<span class="price">25€</span>
						<span class="period">/mois</span>
					</div>
					<ul class="plan-features">
						<li>Tout du plan Pro</li>
						<li>Multi-artistes (10 max)</li>
						<li>Dashboard consolidé</li>
						<li>API access</li>
						<li>Support dédié</li>
						<li>White-label option</li>
					</ul>
					<a href="/auth?plan=label" class="plan-button secondary">Contacter</a>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Final -->
	<section class="final-cta">
		<div class="container">
			<div class="cta-content">
				<h2>Prêt à révolutionner vos liens musicaux ?</h2>
				<p>Rejoignez les artistes français qui font confiance à SmartLink. Essai gratuit, sans engagement.</p>
				<div class="cta-actions">
					<a href="/auth" class="cta-button primary large">
						Créer mon compte gratuitement
						<span class="button-arrow">→</span>
					</a>
				</div>
				<div class="cta-features">
					<span class="feature">✓ Essai gratuit</span>
					<span class="feature">✓ Pas de carte bancaire</span>
					<span class="feature">✓ Support français</span>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	/* Variables CSS */
	:root {
		--primary-color: #3b82f6;
		--primary-dark: #2563eb;
		--accent-color: #ef4444;
		--success-color: #22c55e;
		--warning-color: #f59e0b;
		--gray-50: #f8fafc;
		--gray-100: #f1f5f9;
		--gray-200: #e2e8f0;
		--gray-300: #cbd5e1;
		--gray-400: #94a3b8;
		--gray-500: #64748b;
		--gray-600: #475569;
		--gray-700: #334155;
		--gray-800: #1e293b;
		--gray-900: #0f172a;
		--radius: 0.75rem;
		--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
		--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
	}

	/* Global Styles */
	.landing-page {
		min-height: 100vh;
		background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Hero Section */
	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
		min-height: 100vh;
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero-badge {
		display: inline-block;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.hero-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 1.5rem;
		color: var(--gray-900);
	}

	.text-gradient {
		background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-description {
		font-size: 1.25rem;
		line-height: 1.6;
		color: var(--gray-600);
		margin-bottom: 2rem;
	}

	.hero-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 2.5rem;
		flex-wrap: wrap;
	}

	.stat {
		text-align: center;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 800;
		color: var(--primary-color);
		display: block;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--gray-500);
		margin-top: 0.25rem;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		font-weight: 600;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.cta-button.primary {
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		color: white;
		box-shadow: var(--shadow);
	}

	.cta-button.primary:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.cta-button.secondary {
		background: white;
		color: var(--gray-700);
		border: 1px solid var(--gray-200);
	}

	.cta-button.secondary:hover {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}

	/* Hero Visual */
	.hero-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.phone-mockup {
		width: 280px;
		height: 560px;
		background: linear-gradient(145deg, var(--gray-800), var(--gray-900));
		border-radius: 2.5rem;
		padding: 1rem;
		box-shadow: var(--shadow-lg);
		position: relative;
	}

	.phone-screen {
		width: 100%;
		height: 100%;
		background: white;
		border-radius: 2rem;
		padding: 2rem 1.5rem;
		overflow: hidden;
	}

	.smartlink-preview {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.artist-avatar {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
		border-radius: 50%;
	}

	.artist-name {
		font-weight: 700;
		color: var(--gray-900);
	}

	.track-title {
		color: var(--gray-600);
		font-size: 0.875rem;
	}

	.platform-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.platform-btn {
		padding: 1rem;
		border-radius: var(--radius);
		font-weight: 600;
		text-align: center;
		color: white;
	}

	.platform-btn.spotify { background: #1db954; }
	.platform-btn.apple { background: #000; }
	.platform-btn.deezer { background: #ff6600; }
	.platform-btn.youtube { background: #ff0000; }

	/* Section commune */
	section {
		padding: 5rem 0;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-header h2 {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--gray-900);
		margin-bottom: 1rem;
	}

	.section-header p {
		font-size: 1.25rem;
		color: var(--gray-600);
		max-width: 600px;
		margin: 0 auto;
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.feature-card {
		background: white;
		padding: 2rem;
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--gray-200);
		text-align: center;
		transition: all 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--primary-color);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		display: block;
	}

	.feature-card h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--gray-900);
		margin-bottom: 1rem;
	}

	.feature-card p {
		color: var(--gray-600);
		line-height: 1.6;
	}

	/* Testimonials */
	.testimonials {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.testimonial-card {
		background: white;
		padding: 2rem;
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--gray-200);
	}

	.testimonial-content {
		font-style: italic;
		color: var(--gray-700);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.testimonial-author {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.author-avatar {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
		border-radius: 50%;
	}

	.author-name {
		font-weight: 600;
		color: var(--gray-900);
	}

	.author-role {
		font-size: 0.875rem;
		color: var(--gray-500);
	}

	/* Pricing */
	.pricing {
		background: var(--gray-50);
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.pricing-card {
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius);
		padding: 2rem;
		position: relative;
		text-align: center;
	}

	.pricing-card.featured {
		border-color: var(--primary-color);
		transform: scale(1.05);
		box-shadow: var(--shadow-lg);
	}

	.plan-badge {
		position: absolute;
		top: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--primary-color);
		color: white;
		padding: 0.25rem 1rem;
		border-radius: 2rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.plan-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--gray-900);
		margin-bottom: 1rem;
	}

	.plan-price {
		margin-bottom: 2rem;
	}

	.price {
		font-size: 3rem;
		font-weight: 800;
		color: var(--primary-color);
	}

	.period {
		color: var(--gray-500);
	}

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem 0;
		text-align: left;
	}

	.plan-features li {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--gray-100);
		color: var(--gray-600);
	}

	.plan-features li:before {
		content: "✓ ";
		color: var(--success-color);
		font-weight: 600;
	}

	.plan-button {
		width: 100%;
		justify-content: center;
	}

	/* Final CTA */
	.final-cta {
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		color: white;
		text-align: center;
	}

	.final-cta h2 {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.final-cta p {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.cta-button.large {
		font-size: 1.125rem;
		padding: 1.25rem 2.5rem;
	}

	.cta-features {
		display: flex;
		gap: 2rem;
		justify-content: center;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.feature {
		opacity: 0.8;
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero {
			grid-template-columns: 1fr;
			text-align: center;
			padding: 4rem 1rem;
		}
		
		.hero-visual {
			order: -1;
		}
		
		.phone-mockup {
			width: 240px;
			height: 480px;
		}
		
		.hero-actions {
			justify-content: center;
		}
		
		.pricing-card.featured {
			transform: none;
		}
		
		.cta-features {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>