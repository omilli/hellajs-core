import type { Context, ReactiveContext } from "../../context";
import type { EffectFn } from "../types";
import { NOT_TRACKING } from "./tracker";

/**
 * Schedule effects to run with proper priority handling
 */
export function scheduleEffects(
	reactive: ReactiveContext,
	effects: EffectFn[],
): void {
	// Sort by priority (if available)
	const sorted = [...effects].sort((a, b) => {
		const priorityA = a._priority || 0;
		const priorityB = b._priority || 0;
		return priorityB - priorityA; // Higher priority runs first
	});

	// Schedule effects to run
	for (const effect of sorted) {
		if (!reactive.pendingRegistry.has(effect)) {
			reactive.pendingNotifications.push(effect);
			reactive.pendingRegistry.add(effect);
		}
	}

	// If we're not batching, flush immediately
	if (reactive.batchDepth === 0) {
		flushEffects(reactive);
	}
}

/**
 * Schedule effects to run after current operations complete
 */
export function queueEffects(
	reactive: ReactiveContext,
	subscribers: Set<WeakRef<EffectFn>>,
): void {
	if (subscribers.size === 0) return;

	// Efficient deduplication using the pending registry
	let hasQueuedEffects = false;

	// Process subscribers, cleaning up dead references
	for (const ref of subscribers) {
		const effect = ref.deref();
		if (effect) {
			// Only queue if not already pending
			if (!reactive.pendingRegistry.has(effect)) {
				reactive.pendingNotifications.push(effect);
				reactive.pendingRegistry.add(effect);
				hasQueuedEffects = true;
			}
		} else {
			// Clean up dead reference
			subscribers.delete(ref);
		}
	}

	// Run effects immediately if not batching and we have queued effects
	if (reactive.batchDepth === 0 && hasQueuedEffects) {
		flushEffects(reactive);
	}
}

/**
 * Process all queued effects
 */
export function flushEffects(reactive: ReactiveContext): void {
	if (reactive.pendingNotifications.length === 0) return;

	// Sort by priority (higher runs first)
	const effectsToRun = [...reactive.pendingNotifications].sort((a, b) => {
		return (b._priority || 0) - (a._priority || 0);
	});

	// Clear pending notifications before running effects to avoid cycles
	reactive.pendingNotifications.length = 0;
	reactive.pendingRegistry.clear();

	// Run each effect, skipping disposed ones
	for (const effect of effectsToRun) {
		if (!effect._disposed) {
			effect();
		}
	}
}

/**
 * Gets the currently active effect if there is one
 * @returns The current effect function or null if not in an effect
 */
export function getCurrentEffect({ reactive }: Context): EffectFn | null {
	return reactive.activeTracker === NOT_TRACKING ||
		typeof reactive.activeTracker === "symbol"
		? null
		: (reactive.activeTracker as EffectFn);
}
