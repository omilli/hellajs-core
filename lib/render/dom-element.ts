import { delegateEvents } from "../events";
import type { HellaElement } from "../types";
import { propHandler } from "./utils";

/**
 * Renders a HellaElement or string into the specified container.
 *
 * @param hellaElement - The element to render, which can be a HellaElement object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 *
 */
export function renderDomElement(
	hellaElement: HellaElement | string,
	container: Element,
): HTMLElement | Text {
	if (typeof hellaElement === "string") {
		return document.createTextNode(hellaElement);
	}

	const { type, props, children } = hellaElement;

	//Create a DOM element based on the HellaElement's type
	const domElement = document.createElement(type) as HTMLElement;

	// Clear the container's existing content
	container.innerHTML = "";
	// Append the new element to the container
	container.appendChild(domElement);

	//Apply props to the element
	handleProps(domElement, props);

	//Set up event handlers
	delegateEvents(domElement, props);

	//Process and render any children
	handleChildren(domElement, children);

	return domElement;
}

/**
 * Appends rendered child elements to the specified DOM element.
 *
 * @param domElement - The parent HTML element to append children to
 * @param children - Array of child elements to be rendered and appended
 */
function handleChildren(
	domElement: HTMLElement,
	children: HellaElement["children"] = [],
) {
	children.forEach((child) => {
		const childElement = renderDomElement(child, domElement);
		domElement.appendChild(childElement);
	});
}

/**
 * Sets HTML attributes and properties on a DOM element based on a provided props object.
 *
 * @param domElement - The HTML element to apply attributes and properties to
 * @param props - An object containing the properties to apply to the element
 *
 */
function handleProps(
	domElement: HTMLElement,
	props: HellaElement["props"] = {},
) {
	propHandler(props, {
		classProp: (className) => {
			domElement.className = className;
		},
		boolProp: (key) => {
			domElement.setAttribute(key, "");
		},
		regularProp: (key, value) => {
			domElement.setAttribute(key, String(value));
		},
	});
}
