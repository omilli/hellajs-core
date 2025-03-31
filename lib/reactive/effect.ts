import { getDefaultContext } from "../context";
import type { EffectFn, EffectOptions } from "../types";
import { setActiveTracker, unsubscribeDependencies } from "../utils";

/**
 * Creates an effect that runs when its dependencies change.
 * Effects automatically track reactive dependencies used within the effect function
 * and re-execute when those dependencies change.
 *
 * @param fn - The function to execute when dependencies change
 * @param options - Optional configuration for the effect behavior
 * @returns A dispose function that can be called to clean up the effect
 */
export function effect(
	fn: EffectFn,
	options?: EffectOptions,
	{ reactive } = getDefaultContext(),
): EffectFn {
	const { name, scheduler, once, debounce, onError, onCleanup } = options || {};

	// Store user's cleanup function if provided
	let userCleanup: (() => void) | undefined = onCleanup;

	// For debouncing
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let isFirstRun = true;

	/**
	 * Schedules effect execution using the provided scheduler or runs it directly
	 */
	const scheduleRun = (runFn: () => void) => {
		if (scheduler) {
			scheduler(runFn);
		} else {
			runFn();
		}
	};

	/**
	 * Manages debouncing and schedules the effect's execution
	 */
	const handleEffectScheduling = () => {
		const skipWhen = [
			observer._disposed,
			detectCircularDependency(),
			shouldSkipOnceEffect(),
			shouldDebounce(),
		];

		if (skipWhen.some(Boolean)) {
			return;
		}

		// For first run or non-debounced runs
		isFirstRun = false;

		// Use the scheduler for effect execution
		scheduleRun(executeEffectCore);
	};

	/**
	 * Checks if the effect is creating a circular dependency
	 */
	const detectCircularDependency = (): boolean => {
		if (reactive.executionContext.includes(observer)) {
			console.warn("Circular dependency detected in effect", {
				runningEffectsSize: reactive.executionContext.length,
				effectId: name || observer.toString().substring(0, 50),
			});
			return true;
		}
		return false;
	};

	/**
	 * Determines if a "once" effect should be skipped
	 */
	const shouldSkipOnceEffect = (): boolean => {
		return Boolean(once && (observer as EffectFn)._hasRun);
	};

	/**
	 * Handles debouncing logic and returns whether execution should be deferred
	 */
	const shouldDebounce = (): boolean => {
		if (debounce && debounce > 0 && !isFirstRun) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => scheduleRun(executeEffectCore), debounce);
			return true;
		}
		return false;
	};

	/**
	 * Core function to execute the effect with proper tracking setup
	 */
	const executeEffectCore = () => {
		// Remove prior subscriptions
		unsubscribeDependencies(observer, reactive);

		// Establish tracking context
		const previousTracker = reactive.activeTracker;
		const previousParentEffect = reactive.currentExecutingEffect;

		// Set this effect as the current executing effect
		reactive.currentExecutingEffect = disposeEffect;

		setActiveTracker(reactive, observer);
		reactive.executionContext.push(observer);

		try {
			const result = fn() as void | Promise<void> | (() => void);
			handleEffectResult(result);
		} catch (error) {
			handleEffectError(error);
		} finally {
			// Restore previous context
			reactive.executionContext.pop();
			setActiveTracker(reactive, previousTracker);
			reactive.currentExecutingEffect = previousParentEffect;
		}
	};

	/**
	 * Handles the result returned by the effect function
	 */
	const handleEffectResult = (result: void | Promise<void> | (() => void)) => {
		// Handle the case where the effect returns a cleanup function
		if (typeof result === "function") {
			userCleanup = result;
		}
		// Handle async functions that return promises
		else if (result instanceof Promise) {
			result.catch((error) => {
				handleEffectError(error);
			});
		}

		// Mark as having run at least once (for "once" option)
		if (once) {
			(observer as EffectFn)._hasRun = true;
		}
	};

	/**
	 * Handles errors that occur during effect execution
	 */
	const handleEffectError = (error: unknown) => {
		if (onError && error instanceof Error) {
			onError(error);
		} else {
			console.error("Error in effect:", error);
		}
	};

	// Create an observer function
	const observer: EffectFn = () => handleEffectScheduling();

	// Attach metadata to the observer
	Object.defineProperties(observer, {
		_name: { value: name },
		_hasRun: { value: false, writable: true },
		_priority: { value: options?.priority },
		_disposed: { value: false, writable: true },
	});

	// Create dependency tracking set in context
	reactive.effectDependencies.set(observer, new Set());

	/**
	 * Handles cleanup of all resources associated with the effect
	 */
	const disposeEffect = () => {
		// Cancel any pending debounced execution
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}

		// Mark as disposed immediately to prevent any future executions
		observer._disposed = true;

		// Dispose all child effects first
		disposeChildEffects();

		// Run user cleanup if provided
		runUserCleanup();

		// Remove from pending notifications if it's queued
		removeFromPendingQueue();

		// Clean up all dependencies and registries
		unsubscribeDependencies(observer, reactive);
		reactive.pendingRegistry.delete(observer);
		reactive.effectDependencies.delete(observer);
	};

	/**
	 * Disposes any child effects created by this effect
	 */
	const disposeChildEffects = () => {
		const childEffects = reactive.parentChildEffectsMap.get(disposeEffect);
		if (childEffects) {
			for (const childDispose of childEffects) {
				childDispose();
			}
			childEffects.clear();
			reactive.parentChildEffectsMap.delete(disposeEffect);
		}
	};

	/**
	 * Executes user-provided cleanup function safely
	 */
	const runUserCleanup = () => {
		if (userCleanup) {
			try {
				userCleanup();
			} catch (error) {
				console.error("Error in effect cleanup:", error);
			}
		}
	};

	/**
	 * Removes the effect from the pending notifications queue
	 */
	const removeFromPendingQueue = () => {
		const pendingIndex = reactive.pendingNotifications.findIndex(
			(e) => e === observer || e._effect === observer || observer._effect === e,
		);

		if (pendingIndex !== -1) {
			reactive.pendingNotifications.splice(pendingIndex, 1);
		}
	};

	// Add metadata to the dispose function
	Object.defineProperties(disposeEffect, {
		_name: { value: name },
		_effect: { value: observer },
	});

	// Register parent-child relationship for automatic cleanup
	if (reactive.currentExecutingEffect) {
		let parentChildEffects = reactive.parentChildEffectsMap.get(
			reactive.currentExecutingEffect,
		);
		if (!parentChildEffects) {
			parentChildEffects = new Set();
			reactive.parentChildEffectsMap.set(
				reactive.currentExecutingEffect,
				parentChildEffects,
			);
		}
		parentChildEffects.add(disposeEffect);
	}

	// Handle custom scheduling or immediate execution
	if (scheduler) {
		scheduler(observer);
	} else {
		observer(); // Initial execution
	}

	// Return cleanup function
	return disposeEffect;
}
