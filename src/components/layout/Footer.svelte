<script>
	import { page } from '$app/stores';
	
	$: currentYear = new Date().getFullYear();
	$: isPublicPage = $page.route?.id === '/' || $page.route?.id?.includes('/s/');
</script>

<footer class="footer" class:public={isPublicPage}>
	<div class="footer-content">
		<div class="footer-brand">
			<span class="footer-logo">🔗 SmartLink</span>
			<span class="footer-tagline">Liens intelligents pour artistes français</span>
		</div>
		
		<div class="footer-links">
			<div class="link-group">
				<h4>Produit</h4>
				<a href="/features">Fonctionnalités</a>
				<a href="/pricing">Tarifs</a>
				<a href="/templates">Templates</a>
			</div>
			
			<div class="link-group">
				<h4>Support</h4>
				<a href="/help">Aide</a>
				<a href="/contact">Contact</a>
				<a href="/api-docs">API</a>
			</div>
			
			<div class="link-group">
				<h4>Légal</h4>
				<a href="/privacy">Confidentialité</a>
				<a href="/terms">Conditions</a>
				<a href="/cookies">Cookies</a>
			</div>
		</div>
		
		<div class="footer-bottom">
			<div class="footer-copyright">
				© {currentYear} SmartLink. Fait avec ❤️ en France.
			</div>
			
			<div class="footer-social">
				<a href="https://twitter.com/smartlink" aria-label="Twitter" target="_blank" rel="noopener">
					🐦
				</a>
				<a href="https://instagram.com/smartlink" aria-label="Instagram" target="_blank" rel="noopener">
					📸
				</a>
				<a href="https://linkedin.com/company/smartlink" aria-label="LinkedIn" target="_blank" rel="noopener">
					💼
				</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--pico-card-background-color);
		border-top: 1px solid var(--pico-muted-border-color);
		padding: var(--smartlink-spacing-xl) var(--smartlink-spacing-md);
		margin-top: auto;
	}

	.footer.public {
		margin-top: var(--smartlink-spacing-2xl);
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		gap: var(--smartlink-spacing-xl);
	}

	.footer-brand {
		text-align: center;
	}

	.footer-logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--smartlink-primary);
		display: block;
		margin-bottom: var(--smartlink-spacing-xs);
	}

	.footer-tagline {
		color: var(--pico-muted-color);
		font-size: 0.875rem;
	}

	.footer-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--smartlink-spacing-lg);
	}

	.link-group h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--pico-color);
		margin-bottom: var(--smartlink-spacing-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.link-group a {
		display: block;
		color: var(--pico-muted-color);
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: var(--smartlink-spacing-xs);
		transition: color 0.15s ease;
	}

	.link-group a:hover {
		color: var(--smartlink-primary);
	}

	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--smartlink-spacing-md);
		padding-top: var(--smartlink-spacing-lg);
		border-top: 1px solid var(--pico-muted-border-color);
		flex-wrap: wrap;
	}

	.footer-copyright {
		color: var(--pico-muted-color);
		font-size: 0.875rem;
	}

	.footer-social {
		display: flex;
		gap: var(--smartlink-spacing-sm);
	}

	.footer-social a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--smartlink-gray-100);
		color: var(--pico-muted-color);
		text-decoration: none;
		font-size: 1.25rem;
		transition: all 0.15s ease;
	}

	.footer-social a:hover {
		background: var(--smartlink-primary);
		color: white;
		transform: translateY(-2px);
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.footer {
			padding: var(--smartlink-spacing-lg) var(--smartlink-spacing-md);
		}

		.footer-links {
			grid-template-columns: repeat(2, 1fr);
			gap: var(--smartlink-spacing-md);
		}

		.footer-bottom {
			flex-direction: column;
			text-align: center;
			gap: var(--smartlink-spacing-sm);
		}
	}

	/* Tablet styles */
	@media (max-width: 1024px) {
		.footer-links {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>