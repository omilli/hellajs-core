import { getDefaultContext } from "../context";
import type { HNode } from "../types";
import { renderDomElement } from "./dom";
import { renderStringElement } from "./string";
import type { RenderedNode } from "./types";
import { getRootElement } from "./utils";

/**
 * Renders an HNode to either a string (server environment) or the DOM (client environment).
 *
 * @param hNode - The element to be rendered
 * @param rootSelector - Optional target rootSelector. Can be a DOM Element or a CSS selector string.
 * @returns A string in server environments or a RenderedNode instance in client environments
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

	const element = renderDomElement(
		hNode,
		rootElement,
		rootSelector,
		context,
	);

	return {
		element,
		hNode,
	};
}
