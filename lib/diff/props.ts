import { propProcessor } from "../render";
import type { VNode } from "../types";

export function updateProps(
	element: HTMLElement,
	props: VNode["props"] = {},
): void {
	const attrsToRemove = new Set<string>();
	const attrs = element.attributes;
	const attrLen = attrs.length;

	for (let i = 0; i < attrLen; i++) {
		const attr = attrs[i];
		const name = attr.name;
		// Check if name starts with 'data-'
		const shouldRemoveProp =
			!(
				name.charCodeAt(0) === 100 &&
				name.charCodeAt(1) === 97 &&
				name.charCodeAt(2) === 116 &&
				name.charCodeAt(3) === 97 &&
				name.charCodeAt(4) === 45
			) && name !== "class";

		if (shouldRemoveProp) {
			attrsToRemove.add(name);
		}
	}

	propProcessor(props, {
		classProp(className) {
			if (element.className !== className) {
				element.className = className;
			}
		},
		boolProp(key) {
			attrsToRemove.delete(key);
			if (!element.hasAttribute(key)) {
				element.setAttribute(key, "");
			}
		},
		regularProp(key, value) {
			attrsToRemove.delete(key);
			const strValue = String(value);
			if (element.getAttribute(key) !== strValue) {
				element.setAttribute(key, strValue);
			}
		},
	});

	attrsToRemove.forEach((attr) => {
		// Check if starts with 'on'
		if (!(attr.charCodeAt(0) === 111 && attr.charCodeAt(1) === 110)) {
			element.removeAttribute(attr);
		}
	});
}
