import { getDefaultContext } from "../context";
import { delegateEvents } from "../events";
import type { HellaElement } from "../types";
import { generateKey } from "../utils";
import { storeElement } from "./store";
import type { RenderDomArgs, RenderReturnElement } from "./types";
import { propHandler } from "./utils";

const getDomArgs = (args: RenderDomArgs) =>
	({
		...{
			hellaElement: {},
			rootElement: document.body,
			domElement: document.createDocumentFragment(),
			rootSelector: "body",
			context: getDefaultContext(),
		},
		...args,
	}) as Required<RenderDomArgs>;

/**
 * Renders a HellaElement or string into the specified container.
 *
 * @param hellaElement - The element to render, which can be a HellaElement object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 */
export function renderDomElement(args: RenderDomArgs): RenderReturnElement {
	const { hellaElement, rootElement, rootSelector, context } = getDomArgs(args);

	if (!rootElement) {
		throw new Error("Root element is required");
	}

	const domElement = createDomElement({ hellaElement, rootSelector, context });

	// Clear container more efficiently than using innerHTML
	rootElement.textContent = "";

	// Append the new element
	if (domElement instanceof DocumentFragment) {
		rootElement.appendChild(domElement);
		// Return the container as we can't return the fragment after it's been appended
		return rootElement as HTMLElement;
	} else {
		rootElement.appendChild(domElement);
		return domElement;
	}
}

/**
 * Creates a DOM element based on a HellaElement or a string.
 *
 * If the input is a string, it creates aexport { events } from "./events";
 text node.
 * If the input is a HellaElement, it creates an element of the specified type,
 * applies the given properties, and processes any children.
 *
 * @param hellaElement - The HellaElement or string to create the DOM element from.
 * @returns The created HTMLElement, Text node, or DocumentFragment.
 */
export function createDomElement(args: RenderDomArgs): RenderReturnElement {
	const { hellaElement, rootSelector, context } = getDomArgs(args);

	if (typeof hellaElement === "string") {
		return document.createTextNode(hellaElement);
	}

	const { type } = hellaElement;

	if (!type) {
		return handleFragments({ hellaElement, rootSelector, context });
	}

	// Create a DOM element based on the HellaElement's type
	const domElement = document.createElement(type) as HTMLElement;

	const elementKey = generateKey();

	domElement.dataset.hKey = elementKey;

	storeElement({
		context,
		domElement,
		elementKey,
		hellaElement,
		rootSelector,
	});

	// Apply props to the element
	handleProps({domElement, hellaElement});

	// Set up event handlers
	handleEvents(domElement, hellaElement, rootSelector);

	// Process and render any children
	handleChildren({ domElement, hellaElement, rootSelector, context });

	return domElement;
}

function handleFragments(args: RenderDomArgs): DocumentFragment {
	const { hellaElement, rootSelector, context } = getDomArgs(args);
	const domElement = document.createDocumentFragment();

	handleChildren({ domElement, hellaElement, rootSelector, context });

	return domElement;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(args: RenderDomArgs) {
	const { hellaElement, rootSelector, context, domElement } = getDomArgs(args);

	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	(hellaElement as HellaElement).children?.forEach((child) => {
		const childElement = createDomElement({
			hellaElement: child,
			rootSelector,
			context,
		});
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	domElement.appendChild(fragment);
}

/**
 * Sets HTML attributes and properties on a DOM element
 */
function handleProps(
	args: RenderDomArgs
): void {
	const { hellaElement, domElement } = getDomArgs(args);
	propHandler((hellaElement as HellaElement).props || {}, {
		classProp(className) {
			(domElement as HTMLElement).className = className;
		},
		boolProp(key) {
			(domElement as HTMLElement).setAttribute(key, "");
		},
		regularProp(key, value) {
			(domElement as HTMLElement).setAttribute(key, String(value));
		},
	});
}

function handleEvents(
	domElement: HTMLElement,
	hellaElement: HellaElement,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hellaElement.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		domElement.dataset.eKey = generateKey();
		eventProps.forEach(() =>
			delegateEvents(
				hellaElement,
				rootSelector,
				domElement.dataset.eKey as string,
			),
		);
	}
}
