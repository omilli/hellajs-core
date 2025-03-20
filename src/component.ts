import type { RenderedComponent, State, StateBase } from "./types";

/**
 * Creates a component with associated state and render function.
 * Initializes a component by extracting its state and render function from the provided factory,
 * and connects the render function to the state for re-rendering if the state supports it.
 * 
 * @template T - Type of the component's state, extending State<{}>
 * @param options - Factory function that returns an object containing the component's state and render function
 * @returns The render function that, when called, produces a RenderedComponent
 */
export function component<T extends State<{}>>(
	options: () => { state: T; render: () => RenderedComponent },
) {
	const { state, render } = options();
	(state as StateBase).setStateRender?.(render);
	return render;
}
