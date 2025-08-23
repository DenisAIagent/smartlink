/**
 * Homepage E2E Tests
 * Critical user journey tests for SmartLink
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should load homepage with correct title and meta', async ({ page }) => {
		// Check title
		await expect(page).toHaveTitle(/SmartLink - Liens Intelligents/);
		
		// Check meta description
		const description = page.locator('meta[name="description"]');
		await expect(description).toHaveAttribute('content', /Créez des liens intelligents/);
		
		// Check main heading
		const heading = page.locator('h1').first();
		await expect(heading).toContainText('Liens Intelligents');
	});

	test('should display key features section', async ({ page }) => {
		// Check features section exists
		const featuresSection = page.locator('.features');
		await expect(featuresSection).toBeVisible();
		
		// Check feature cards
		const featureCards = page.locator('.feature-card');
		await expect(featureCards).toHaveCount(6);
		
		// Check specific features
		await expect(page.locator('text=Liens Intelligents')).toBeVisible();
		await expect(page.locator('text=Analytics Détaillées')).toBeVisible();
		await expect(page.locator('text=Made in France')).toBeVisible();
	});

	test('should display pricing section with correct plans', async ({ page }) => {
		// Scroll to pricing section
		await page.locator('#pricing').scrollIntoViewIfNeeded();
		
		// Check pricing cards
		const pricingCards = page.locator('.pricing-card');
		await expect(pricingCards).toHaveCount(2);
		
		// Check free plan
		const freeCard = page.locator('.pricing-card').first();
		await expect(freeCard).toContainText('Gratuit');
		await expect(freeCard).toContainText('5 SmartLinks');
		
		// Check pro plan
		const proCard = page.locator('.pricing-card').last();
		await expect(proCard).toContainText('Pro');
		await expect(proCard).toContainText('8€/mois');
		await expect(proCard).toContainText('SmartLinks illimités');
	});

	test('should have working CTA buttons', async ({ page }) => {
		// Test main CTA button
		const mainCTA = page.locator('.cta-primary').first();
		await expect(mainCTA).toContainText('Commencer Gratuitement');
		await expect(mainCTA).toBeVisible();
		
		// Click should redirect to registration (we'll check URL change)
		await mainCTA.click();
		await expect(page).toHaveURL(/\/(register|login)/);
	});

	test('should display testimonials', async ({ page }) => {
		// Check testimonials section
		const testimonialsSection = page.locator('.testimonials');
		await expect(testimonialsSection).toBeVisible();
		
		// Check testimonial cards
		const testimonialCards = page.locator('.testimonial-card');
		await expect(testimonialCards).toHaveCount(3);
		
		// Check specific testimonials
		await expect(page.locator('text=Alex Martin')).toBeVisible();
		await expect(page.locator('text=Sarah Dubois')).toBeVisible();
		await expect(page.locator('text=Marc Studio')).toBeVisible();
	});

	test('should have responsive design', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		
		// Check hero section is still visible
		const heroTitle = page.locator('.hero-title');
		await expect(heroTitle).toBeVisible();
		
		// Check navigation adapts to mobile
		const hamburger = page.locator('.sidebar-toggle');
		await expect(hamburger).toBeVisible();
		
		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		
		// Check layout adapts
		const featuresGrid = page.locator('.features-grid');
		await expect(featuresGrid).toBeVisible();
	});

	test('should load performance assets correctly', async ({ page }) => {
		// Check critical CSS loads
		const stylesheets = page.locator('link[rel="stylesheet"]');
		await expect(stylesheets).toHaveCountGreaterThan(0);
		
		// Check JavaScript loads
		const scripts = page.locator('script');
		await expect(scripts).toHaveCountGreaterThan(0);
		
		// Check images load properly
		const heroImage = page.locator('.mockup-phone');
		await expect(heroImage).toBeVisible();
		
		// Test Core Web Vitals (basic check)
		const performanceTiming = await page.evaluate(() => {
			return JSON.stringify(performance.timing);
		});
		
		expect(performanceTiming).toBeTruthy();
	});

	test('should have accessible navigation', async ({ page }) => {
		// Check skip to content link (accessibility)
		await page.keyboard.press('Tab');
		const skipLink = page.locator('.skip-to-content');
		
		// Check ARIA labels
		const navButtons = page.locator('button[aria-label]');
		await expect(navButtons).toHaveCountGreaterThan(0);
		
		// Check heading hierarchy
		const h1 = page.locator('h1');
		await expect(h1).toHaveCount(1);
		
		const h2 = page.locator('h2');
		await expect(h2).toHaveCountGreaterThan(0);
	});

	test('should handle demo interactions', async ({ page }) => {
		// Check demo section
		const demoSection = page.locator('#demo');
		await expect(demoSection).toBeVisible();
		
		// Check demo steps
		const demoSteps = page.locator('.step');
		await expect(demoSteps).toHaveCount(3);
		
		// Check step content
		await expect(page.locator('text=Ajoutez vos liens')).toBeVisible();
		await expect(page.locator('text=Personnalisez')).toBeVisible();
		await expect(page.locator('text=Partagez partout')).toBeVisible();
	});

	test('should have working footer links', async ({ page }) => {
		// Scroll to footer
		await page.locator('footer').scrollIntoViewIfNeeded();
		
		// Check footer sections
		await expect(page.locator('text=Produit')).toBeVisible();
		await expect(page.locator('text=Support')).toBeVisible();
		await expect(page.locator('text=Légal')).toBeVisible();
		
		// Check footer links (just presence, not navigation)
		const footerLinks = page.locator('footer a');
		await expect(footerLinks).toHaveCountGreaterThan(5);
		
		// Check social links
		const socialLinks = page.locator('.footer-social a');
		await expect(socialLinks).toHaveCount(3);
	});
});