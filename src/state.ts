export function createState<T extends Record<string, any>>(initialState: T): T {
	// Store the render function
	let renderFunction: (() => void) | null = null;

	// Function to set a render function for this state instance
	const setStateRender = (render: () => void): void => {
		renderFunction = render;
	};

	const state = {
		...initialState,
		setStateRender,
	};

	// Create a recursive proxy handler
	const createHandler = (path = ""): ProxyHandler<any> => ({
		get(target, prop) {
			// Return the setStateRender function when requested
			if (prop === "setStateRender") {
				return setStateRender;
			}

			// Handle special cases (typeof, toString, etc)
			if (prop === Symbol.toStringTag || prop === "toString") {
				return () => Object.prototype.toString.call(target);
			}

			const value = target[prop];
			// If the property is an object, return a nested proxy
			if (value && typeof value === "object" && !Array.isArray(value)) {
				return new Proxy(value, createHandler(`${path}.${String(prop)}`));
			}
			return value;
		},

		set(target, prop, value) {
			// Update the value
			target[prop] = value;

			// Trigger re-render, use renderFunction if available, otherwise use callback
			if (renderFunction) {
				renderFunction();
			}

			return true;
		},
	});

	// Create the main proxy
	return new Proxy(state, createHandler());
}
