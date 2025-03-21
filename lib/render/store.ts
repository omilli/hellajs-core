import { type ContextState, getRootContext } from "../context";
import type { HellaElement } from "../types";

export function storeElement({
	context,
	rootSelector,
	elementKey,
	domElement,
	hellaElement,
}: {
	context: ContextState;
	rootSelector: string;
	elementKey: string;
	domElement: HTMLElement | Text | DocumentFragment;
	hellaElement: HellaElement;
}): void {
	const rootContext = getRootContext(rootSelector, context);
	const { elements } = rootContext;

	if (!elements.has(elementKey)) {
		elements.set(elementKey, {
			domElement,
			hellaElement,
		});
	}
}
