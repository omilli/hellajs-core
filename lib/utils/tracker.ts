import type { ReactiveContext } from "../context";
import type { EffectFn } from "../types";

/**
 * Symbol representing when no tracking is active
 */
export const NOT_TRACKING = Symbol.for("not-tracking");

/**
 * Checks if there's an active tracker (effect or computation)
 */
export function hasActiveTracker(reactive: ReactiveContext): boolean {
	return reactive.activeTracker !== NOT_TRACKING;
}

/**
 * Gets the active effect tracker
 */
export function getActiveTracker(reactive: ReactiveContext): EffectFn | null {
	return reactive.activeTracker === NOT_TRACKING
		? null
		: (reactive.activeTracker as EffectFn);
}

/**
 * Sets the active tracker
 */
export function setActiveTracker(
	reactive: ReactiveContext,
	tracker: EffectFn | symbol | null,
): void {
	reactive.activeTracker = tracker === null ? NOT_TRACKING : tracker;
}
