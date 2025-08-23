<script>
	import { notifications } from '../../stores/ui.js';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	$: notificationList = $notifications;
</script>

<div class="notification-container">
	{#each notificationList as notification (notification.id)}
		<div
			class="notification notification--{notification.type}"
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 300, duration: 300 }}
			out:fly={{ x: 300, duration: 300 }}
		>
			<div class="notification-content">
				<span class="notification-icon">
					{#if notification.type === 'success'}
						✅
					{:else if notification.type === 'error'}
						❌
					{:else if notification.type === 'warning'}
						⚠️
					{:else}
						ℹ️
					{/if}
				</span>
				
				<div class="notification-text">
					{#if notification.title}
						<div class="notification-title">{notification.title}</div>
					{/if}
					<div class="notification-message">{notification.message}</div>
				</div>
				
				<button
					class="notification-close"
					on:click={() => notifications.remove(notification.id)}
					aria-label="Fermer la notification"
				>
					✕
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.notification-container {
		position: fixed;
		top: var(--smartlink-spacing-lg);
		right: var(--smartlink-spacing-lg);
		z-index: var(--smartlink-z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--smartlink-spacing-sm);
		max-width: 400px;
		pointer-events: none;
	}

	.notification {
		background: var(--pico-card-background-color);
		border-radius: var(--smartlink-radius-lg);
		box-shadow: var(--smartlink-shadow-lg);
		border-left: 4px solid var(--smartlink-primary);
		padding: var(--smartlink-spacing-md);
		pointer-events: auto;
		min-width: 320px;
		max-width: 100%;
		backdrop-filter: blur(8px);
	}

	.notification--success {
		border-left-color: var(--smartlink-success);
	}

	.notification--error {
		border-left-color: var(--smartlink-error);
	}

	.notification--warning {
		border-left-color: var(--smartlink-warning);
	}

	.notification--info {
		border-left-color: var(--smartlink-info);
	}

	.notification-content {
		display: flex;
		align-items: flex-start;
		gap: var(--smartlink-spacing-sm);
	}

	.notification-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.notification-text {
		flex: 1;
		min-width: 0;
	}

	.notification-title {
		font-weight: 600;
		color: var(--pico-color);
		margin-bottom: 2px;
		line-height: 1.4;
	}

	.notification-message {
		color: var(--pico-muted-color);
		font-size: 0.875rem;
		line-height: 1.4;
		word-break: break-word;
	}

	.notification-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px;
		border-radius: var(--smartlink-radius-sm);
		color: var(--pico-muted-color);
		font-size: 1rem;
		flex-shrink: 0;
		transition: all 0.15s ease;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.notification-close:hover {
		background: var(--smartlink-gray-100);
		color: var(--pico-color);
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.notification-container {
			top: var(--smartlink-spacing-md);
			right: var(--smartlink-spacing-md);
			left: var(--smartlink-spacing-md);
			max-width: none;
		}

		.notification {
			min-width: auto;
		}
	}
</style>