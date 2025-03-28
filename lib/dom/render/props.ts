import { delegateEvents } from "../events";
import type { HNode, HNodeProps } from "../types";
import { generateKey } from "../utils";
import type { RenderPropHandler } from "./types";

/**
 * Processes a properties object by categorizing and handling different property types.
 *
 * @param props - An object containing properties to be processed
 * @param options - Handler callbacks for different property types
 */
export function propProcessor(
	props: HNodeProps,
	{ classProp, boolProp, regularProp }: RenderPropHandler,
) {
	Object.entries(props).forEach(([key, value]) => {
		switch (true) {
			case key.startsWith("on"):
				break;
			case key === "className":
				classProp(value as string);
				break;
			case value === true:
				boolProp(key);
				break;
			case value !== null && value !== undefined && value !== false:
				regularProp(key, value);
				break;
		}
	});
}

/**
 * Processes and applies properties to a given DOM element.
 *
 * @param element - The DOM element to which properties will be applied
 * @param props - An object containing properties to be applied to the element
 */
export function processProps(
	element: HTMLElement,
	props: HNode["props"] = {},
): void {
	propProcessor(props, {
		classProp(className) {
			element.className = className;
		},
		boolProp(key) {
			element.setAttribute(key, "");
		},
		regularProp(key, value) {
			element.setAttribute(key, String(value));
		},
	});
}

/**
 * Processes event properties for a given HNode and sets up event delegation.
 *
 * @param element - The DOM element to which event properties will be applied
 * @param hNode - The HNode containing event properties
 * @param rootSelector - A CSS selector for the root element
 */
export function processEventProps(
	element: HTMLElement,
	hNode: HNode,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hNode.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		element.dataset["eKey"] = generateKey();
		delegateEvents(hNode, rootSelector, element.dataset["eKey"] as string);
	}
}
