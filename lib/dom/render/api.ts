import { getDefaultContext } from "../../context";
import type { HNode } from "../types";
import { getRootElement } from "../utils";
import { renderDomElement } from "./dom";
import { renderStringElement } from "./string";
import type { RenderedNode } from "./types";

/**
 * Renders a hypertext node (HNode) as either a DOM element or a string.
 *
 * This function handles rendering in both client and server environments:
 * - In server environments (where `window` is undefined), it renders the HNode as a string.
 * - In client environments, it renders the HNode to the DOM at the specified root selector.
 *
 * @param hNode - The hypertext node to render
 * @param rootSelector - Optional CSS selector to target the DOM element where rendering should occur
 * @param context - The rendering context, defaults to value from getDefaultContext()
 *
 * @returns In server environments, returns a string representation of the rendered element.
 *          In client environments, returns a {@link RenderedNode} object containing the rendered DOM element and original hNode.
 */
export function render(
	hNode: HNode,
	rootSelector?: string,
	context = getDefaultContext(),
): string | RenderedNode {
	// Server environment
	if (typeof window === "undefined") {
		return renderStringElement(hNode);
	}

	// Client environment
	const rootElement = getRootElement(rootSelector);
	rootSelector = rootSelector!;

	const element = renderDomElement(hNode, rootElement, rootSelector, context);

	return {
		element,
		hNode,
	};
}
