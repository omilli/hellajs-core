import { type ContextState, getRootContext } from "../context";
import type { HNode } from "../types";

export function storeElement(
	context: ContextState,
	rootSelector: string,
	elementKey: string,
	element: HTMLElement | Text | DocumentFragment,
	hNode: HNode,
): void {
	const rootContext = getRootContext(rootSelector, context);
	const { elements } = rootContext;

	if (!elements.has(elementKey)) {
		elements.set(elementKey, {
			element,
			hNode,
		});
	}
}
