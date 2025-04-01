import type { ReactiveContext } from "../context";
import type { EffectFn } from "../types";

/**
 * Symbol representing when no tracking is active
 */
export const NOT_TRACKING = Symbol.for("not-tracking");

/**
 * Checks if there is an active effect tracker
 *
 * @param reactive - The reactive context
 * @returns True if there is an active tracker, false otherwise
 */
export function hasActiveTracker({ activeTracker }: ReactiveContext): boolean {
	return activeTracker !== NOT_TRACKING;
}

/**
 * Retrieves the active effect tracker
 *
 * @param reactive - The reactive context
 * @returns The active effect tracker or null if not tracking
 */
export function getActiveTracker({
	activeTracker,
}: ReactiveContext): EffectFn | null {
	return activeTracker === NOT_TRACKING ? null : (activeTracker as EffectFn);
}

/**
 * Sets the active effect tracker
 *
 * @param reactive - The reactive context
 * @param tracker - The effect tracker to set or null to stop tracking
 */
export function setActiveTracker(
	reactive: ReactiveContext,
	tracker: EffectFn | symbol | null,
): void {
	reactive.activeTracker = tracker === null ? NOT_TRACKING : tracker;
}
