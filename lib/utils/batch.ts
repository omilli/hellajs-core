import type { ReactiveContext } from "../context";

/**
 * Starts a batch operation
 */
export function startBatch(reactive: ReactiveContext): void {
	reactive.batchDepth++;
}

/**
 * Ends a batch operation
 */
export function endBatch(reactive: ReactiveContext): boolean {
	if (reactive.batchDepth > 0) {
		reactive.batchDepth--;
		return reactive.batchDepth === 0;
	}
	return false;
}
