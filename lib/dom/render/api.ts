import { getDefaultContext } from "../../context";
import type { VNode } from "../types";
import { getRootElement } from "../utils";
import { renderDomElement } from "./dom";
import { renderStringElement } from "./string";
import type { RenderedNode } from "./types";

/**
 * Renders a hypertext node (VNode) as either a DOM element or a string.
 *
 * This function handles rendering in both client and server environments:
 * - In server environments (where `window` is undefined), it renders the VNode as a string.
 * - In client environments, it renders the VNode to the DOM at the specified root selector.
 *
 * @param vNode - The hypertext node to render
 * @param rootSelector - Optional CSS selector to target the DOM element where rendering should occur
 * @param context - The rendering context, defaults to value from getDefaultContext()
 *
 * @returns In server environments, returns a string representation of the rendered element.
 *          In client environments, returns a {@link RenderedNode} object containing the rendered DOM element and original vNode.
 */
export function render(
	vNode: VNode,
	rootSelector?: string,
	context = getDefaultContext(),
): string | RenderedNode {
	// Server environment
	if (typeof window === "undefined") {
		return renderStringElement(vNode);
	}

	// Client environment
	const rootElement = getRootElement(rootSelector);
	rootSelector = rootSelector!;

	const element = renderDomElement(vNode, rootElement, rootSelector, context);

	return {
		element,
		vNode,
	};
}
