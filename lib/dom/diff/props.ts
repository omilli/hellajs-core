import { propProcessor } from "../render";
import type { VNode } from "../../types";

export function updateProps(
	element: HTMLElement,
	props: VNode["props"] = {},
): void {
	const attrsToRemove = new Set<string>();
	checkProps(element, attrsToRemove);
	applyProps(props, element, attrsToRemove);
	removeEvents(attrsToRemove, element);
}
/**
 * Checks an HTML element's attributes and identifies those that should be removed.
 * An attribute is marked for removal if it doesn't start with 'data-' and is not 'class'.
 *
 * @param element - The HTML element whose attributes are to be checked
 * @param attrsToRemove - A Set to which the names of attributes to be removed will be added
 *
 * @remarks
 * The function identifies data attribute names by directly comparing character codes:
 * - 100, 97, 116, 97, 45 correspond to 'd', 'a', 't', 'a', '-'
 * This function modifies the provided attrsToRemove Set as a side effect.
 */
function checkProps(element: HTMLElement, attrsToRemove: Set<string>): void {
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
}

/**
 * Applies a set of properties to an HTML element.
 *
 * @param props - The properties to apply to the element.
 * @param element - The HTML element to apply properties to.
 * @param attrsToRemove - A set of attribute names that should be removed from the element.
 *                        Attributes that are processed will be deleted from this set.
 *
 * @remarks
 * This function processes three types of properties:
 * - Class properties: Updates the element's className if different from the provided value.
 * - Boolean properties: Ensures the attribute exists on the element.
 * - Regular properties: Sets the attribute value on the element if different from the current value.
 *
 * All processed attributes are removed from the attrsToRemove set, indicating they should be kept.
 */
function applyProps(
	props: VNode["props"] = {},
	element: HTMLElement,
	attrsToRemove: Set<string>,
): void {
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
}

function removeEvents(attrsToRemove: Set<string>, element: HTMLElement): void {
	attrsToRemove.forEach((attr) => {
		// Check if starts with 'on'
		if (!(attr.charCodeAt(0) === 111 && attr.charCodeAt(1) === 110)) {
			element.removeAttribute(attr);
		}
	});
}
