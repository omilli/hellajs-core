import type { HElement, RenderedComponent } from "./types";

function createDOMElement(element: HElement | string): HTMLElement | Text {
	if (typeof element === "string") {
		return document.createTextNode(element);
	}

	const { type, props, children } = element;
	const domElement = document.createElement(type);

	// Apply props
	Object.entries(props).forEach(([key, value]) => {
		if (key === "className") {
			domElement.className = value;
		} else if (key === "style" && typeof value === "object") {
			Object.entries(value).forEach(([styleKey, styleValue]) => {
				(domElement.style as any)[styleKey] = styleValue;
			});
		} else if (key.startsWith("on") && typeof value === "function") {
			const eventName = key.slice(2).toLowerCase();
			domElement.addEventListener(eventName, value);
		} else {
			domElement.setAttribute(key, value);
		}
	});

	// Append children correctly
	children.forEach((child) => {
		const childNode = createDOMElement(child);
		domElement.appendChild(childNode);
	});

	return domElement;
}

export function render(element: HElement, selector: string): RenderedComponent {
	const container = document.querySelector(selector);
	if (!container) {
		throw new Error(`Container element with selector "${selector}" not found`);
	}

	const domElement = createDOMElement(element) as HTMLElement;
	container.innerHTML = "";
	container.appendChild(domElement);

	// Simply return the element and props, no event handling
	return {
		element: domElement,
		props: element,
		pending: false,
	};
}
