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
	// Get the options props
	const { name, scheduler, once, debounce, onError, onCleanup } = options || {};
	// Get the reactive context props
	const {
		activeTracker,
		currentExecutingEffect,
		executionContext,
		effectDependencies,
		parentChildEffectsMap,
		pendingNotifications,
		pendingRegistry,
	} = reactive;
	// Store user's cleanup function if provided
	let userCleanup: (() => void) | undefined = onCleanup;
	// Debounce timeout ID
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	// Flag to indicate if this is the first run
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
		// Check if the effect is disposed or if it should be skipped
		const skipWhen = [
			observer._disposed,
			detectCircularDependency(),
			shouldSkipOnceEffect(),
			shouldDebounce(),
		];
		// If any condition is true, skip execution
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
		// Check if the effect is already in the execution context
		if (executionContext.includes(observer)) {
			// Log a warning for circular dependency
			console.log("Circular dependency: ", {
				runningEffectsSize: executionContext.length,
				effectId: name || observer.toString().substring(0, 50),
			});
			throw new Error("Circular dependency detected in effect");
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
		// Check if debounce is enabled and not the first run
		if (debounce && debounce > 0 && !isFirstRun) {
			// Clear any existing timeout
			clearTimeout(timeoutId);
			// Set a new timeout for the effect execution
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
		// Set the current executing effect to this effect
		reactive.currentExecutingEffect = disposeEffect;
		// Set the active tracker to this effect
		setActiveTracker(reactive, observer);
		// Push the observer to the execution context
		executionContext.push(observer);
		try {
			// Execute the effect function
			const result = fn() as void | Promise<void> | (() => void);
			handleEffectResult(result);
		} catch (error) {
			handleEffectError(error);
		} finally {
			// Restore previous context
			executionContext.pop();
			// Restore the active tracker
			setActiveTracker(reactive, activeTracker);
			// Restore the current executing effect
			reactive.currentExecutingEffect = currentExecutingEffect;
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
			throw `Error in effect: , ${error}`;
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
	effectDependencies.set(observer, new Set());
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
		pendingRegistry.delete(observer);
		effectDependencies.delete(observer);
	};
	/**
	 * Disposes any child effects created by this effect
	 */
	const disposeChildEffects = () => {
		// Get the child effects associated with this effect
		const childEffects = parentChildEffectsMap.get(disposeEffect);
		// If child effects exist
		if (childEffects) {
			// Iterate through each child effect and dispose of it
			for (const childDispose of childEffects) {
				childDispose();
			}
			// Clear the child effects set
			childEffects.clear();
			// Remove the entry from the parent-child effects map
			parentChildEffectsMap.delete(disposeEffect);
		}
	};
	/**
	 * Executes user-provided cleanup function safely
	 */
	const runUserCleanup = () => {
		// Check if user cleanup function exists
		if (userCleanup) {
			// Try to cleanup or log an error
			try {
				userCleanup();
			} catch (error) {
				throw new Error(`Error in effect cleanup:, ${error}`);
			}
		}
	};
	/**
	 * Removes the effect from the pending notifications queue
	 */
	const removeFromPendingQueue = () => {
		// Get the pending notifications for this effect
		const pendingIndex = pendingNotifications.findIndex(
			(e) => e === observer || e._effect === observer || observer._effect === e,
		);
		// If found, remove it from the pending notifications
		if (pendingIndex !== -1) {
			pendingNotifications.splice(pendingIndex, 1);
		}
	};
	// Add metadata to the dispose function
	Object.defineProperties(disposeEffect, {
		_name: { value: name },
		_effect: { value: observer },
	});
	// Register parent-child relationship for automatic cleanup
	if (currentExecutingEffect) {
		// Get the parent-child effects map
		let parentChildEffects = parentChildEffectsMap.get(currentExecutingEffect);
		// If it doesn't exist
		if (!parentChildEffects) {
			// Create a new set
			parentChildEffects = new Set();
			// Store the parent-child effects
			parentChildEffectsMap.set(currentExecutingEffect, parentChildEffects);
		}
		// Add this effect to the parent's child effects
		parentChildEffects.add(disposeEffect);
	}
	// Handle custom scheduling or immediate execution
	if (scheduler) {
		scheduler(observer);
	} else {
		// Initial execution
		observer();
	}
	// Return cleanup function
	return disposeEffect;
}
