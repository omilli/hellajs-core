import { type ContextState, getRootContext } from "../context";
import type { HNode } from "../types";


export function storeElement(
	hNode: HNode,
	element: HTMLElement | Text | DocumentFragment,
	rootSelector: string,
	elementKey: string,
	context: ContextState,
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
