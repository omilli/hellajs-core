import { getRootContext } from "../context";
import type { HellaElement } from "../types";

export function storeElement({
	rootSelector,
	elementKey,
	domElement,
	hellaElement,
}: {
	rootSelector: string;
	elementKey: string;
	domElement: HTMLElement | Text | DocumentFragment;
	hellaElement: HellaElement;
}): void {
	const rootContext = getRootContext(rootSelector);
	const { elements } = rootContext;

	if (!elements.has(elementKey)) {
		elements.set(elementKey, {
			domElement,
			hellaElement,
		});
	}
}
