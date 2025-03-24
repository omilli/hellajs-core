import type { StateRender } from "./types";

export function createState<T extends object>(initialState: T): T {
	// Create a mutable version of the state
	const stateObject = { ...initialState };

	// Create the proxy that will trigger renders when properties change
	return new Proxy(stateObject, {
		set(target, prop, value) {
			// Skip if the value hasn't changed
			if (target[prop as keyof typeof target] === value) {
				return true;
			}

			// Update the property
			target[prop as keyof typeof target] = value;

			// Call the render method if it exists
			if (typeof (target as StateRender)._render === "function") {
				(target as StateRender)._render?.();
			}

			return true;
		},
	});
}
