import type { EventFn, RenderedComponent } from "./types";

/**
 * Hydrates a component with new data
 * @param component Function that renders the component
 * @param fn Optional event handler to run before re-rendering
 */
export const hydrater =
	(component: () => RenderedComponent) => (fn?: EventFn) => (e: Event) => {
		fn?.(e);
		component();
	};
