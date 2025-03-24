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
 * Sets HTML attributes and properties on a DOM element
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

export function processEventProps(
	element: HTMLElement,
	hNode: HNode,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hNode.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		element.dataset.eKey = generateKey();
		delegateEvents(hNode, rootSelector, element.dataset.eKey as string);
	}
}
