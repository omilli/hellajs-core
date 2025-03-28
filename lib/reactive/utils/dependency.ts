import type { ReactiveContext } from "../../context";
import type { EffectFn, Signal, SignalBase } from "../types";
import { scheduleEffects } from "./effect";
import { getActiveTracker, hasActiveTracker } from "./tracker";

/**
 * Add a dependency relationship between an effect and a reactive source
 */
export function addDependency(
	reactive: ReactiveContext,
	effect: EffectFn,
	source: unknown,
): void {
	// Add source to effect's dependencies
	const deps = reactive.effectDependencies.get(effect) || new Set();
	deps.add(source);
	reactive.effectDependencies.set(effect, deps);
}

/**
 * Track the current effect as dependent on a signal
 * This is called when a signal is read within an effect
 */
export function trackDependency(
	reactive: ReactiveContext,
	signal: SignalBase,
): void {
	// Only track if there's an active effect
	if (!hasActiveTracker(reactive)) return;

	const activeEffect = getActiveTracker(reactive);
	if (!activeEffect) return;

	// Add bidirectional dependency relationship
	// 1. Store signal as a dependency of the active effect
	addDependency(reactive, activeEffect, signal);

	// 2. Store effect as a dependent of the signal
	signal._deps.add(new WeakRef(activeEffect));
}

/**
 * Notify all effects that depend on a changed signal
 */
export function notifyDependents(
	reactive: ReactiveContext,
	signal: SignalBase,
): void {
	// Early return if no pending queue is needed
	if (reactive.batchDepth === 0 && signal._deps.size === 0) return;

	// Collect subscribers and clean up dead references
	const liveEffects: EffectFn[] = [];
	const deadRefs: WeakRef<EffectFn>[] = [];

	for (const ref of signal._deps) {
		const effect = ref.deref();
		if (effect) {
			liveEffects.push(effect);
		} else {
			deadRefs.push(ref);
		}
	}

	// Clean up garbage collected effect references
	for (const ref of deadRefs) {
		signal._deps.delete(ref);
	}

	// During batching, just collect effects
	if (reactive.batchDepth > 0) {
		for (const effect of liveEffects) {
			if (!reactive.pendingRegistry.has(effect)) {
				reactive.pendingNotifications.push(effect);
				reactive.pendingRegistry.add(effect);
			}
		}
		return;
	}

	// Not batching, schedule effects to run
	scheduleEffects(reactive, liveEffects);
}

/**
 * Remove an effect from all its dependencies
 */
export function unsubscribeDependencies(
	effect: EffectFn,
	reactive: ReactiveContext,
) {
	// Get dependencies from both context-specific storage
	const ctxDeps = reactive.effectDependencies.get(effect) as Set<
		Signal<unknown>
	>;

	// Thorough cleanup of dependency sets
	const allDeps = new Set(ctxDeps);

	// For each signal this effect depends on, remove the effect from its subscribers
	for (const signal of allDeps) {
		if (signal?._deps) {
			const subscribers = signal._deps;
			// Create array of refs to remove so we can modify while iterating
			const refsToRemove = [];

			for (const weakRef of subscribers) {
				const subscribedEffect = weakRef.deref();
				// Enhanced comparison - also check if this is the same observer function via _effect property
				if (
					!subscribedEffect ||
					subscribedEffect === effect ||
					subscribedEffect._effect === effect ||
					effect._effect === subscribedEffect
				) {
					refsToRemove.push(weakRef);
				}
			}

			// Now remove all the marked refs
			for (const ref of refsToRemove) {
				subscribers.delete(ref);
			}
		}
	}

	// Clear and delete from context tracking
	if (ctxDeps) {
		ctxDeps.clear();
		reactive.effectDependencies.delete(effect);
	}
}
