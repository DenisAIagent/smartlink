<script>
	import { createEventDispatcher } from 'svelte';
	import { modal } from '../../stores/ui.js';
	import { fade, scale } from 'svelte/transition';
	
	const dispatch = createEventDispatcher();
	
	// Close modal on escape key
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			modal.close();
		}
	}
	
	// Close modal when clicking outside
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			modal.close();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $modal.isOpen}
	<div 
		class="modal-backdrop" 
		transition:fade={{ duration: 200 }}
		on:click={handleBackdropClick}
	>
		<div 
			class="modal-container" 
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="modal-content">
				{#if $modal.component}
					<svelte:component this={$modal.component} {...$modal.props} />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: var(--smartlink-z-modal);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--smartlink-spacing-lg);
		backdrop-filter: blur(4px);
	}

	.modal-container {
		background: var(--pico-card-background-color);
		border-radius: var(--smartlink-radius-xl);
		box-shadow: var(--smartlink-shadow-2xl);
		max-width: 90vw;
		max-height: 90vh;
		overflow: hidden;
		border: 1px solid var(--pico-muted-border-color);
	}

	.modal-content {
		overflow: auto;
		max-height: 90vh;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.modal-backdrop {
			padding: var(--smartlink-spacing-md);
		}

		.modal-container {
			max-width: 100%;
			max-height: 95vh;
			margin: 0;
			border-radius: var(--smartlink-radius-lg);
		}

		.modal-content {
			max-height: 95vh;
		}
	}
</style>