import { delegateEvents } from "../events";
import { propProcessor } from "../render";
import type { VNode } from "../types";
import { castToString, generateKey } from "../utils";

export function processAttributes(
	element: HTMLElement,
	vNode: VNode,
	rootSelector: string,
): void {
	// Get the vNode props
	const { props = {} } = vNode;
	// Set to store attributes to be removed
	const attrsToRemove = new Set<string>();
	// Get the attributes of the element
	const attrs = element.attributes;
	// Count the element attributes
	const attrLen = attrs.length;
	// Process attributes
	for (let i = 0; i < attrLen; i++) {
		// The current attribute
		const attr = attrs[i];
		// The attribute name (vNode prop key)
		const name = attr.name;
		// Check if name starts with 'data-'
		// Use charCodeAt for performance
		// 'd'=100, 'a'=97, 't'=116, '-'=45
		const shouldRemoveProp =
			!(
				name.charCodeAt(0) === 100 &&
				name.charCodeAt(1) === 97 &&
				name.charCodeAt(2) === 116 &&
				name.charCodeAt(3) === 97 &&
				name.charCodeAt(4) === 45
			) && name !== "class";
		// Set the attribute to be removed
		// if it doesn't start with 'data-' or is not 'class'
		if (shouldRemoveProp) {
			attrsToRemove.add(name);
		}
	}
	// Process the vNode props
	propProcessor(props, {
		classProp(className) {
			// Set the element class if its not the same as the vNode class
			if (element.className !== className) {
				element.className = className;
			}
		},
		boolProp(key) {
			// Delete the attribute from the set
			attrsToRemove.delete(key);
			// Set the attribute to an empty string
			// This is a workaround for boolean attributes
			if (!element.hasAttribute(key)) {
				element.setAttribute(key, "");
			}
		},
		regularProp(key, value) {
			// Delete the attribute from the set
			attrsToRemove.delete(key);
			// Cast to string if needed
			const strValue = castToString(value as string | number);
			if (element.getAttribute(key) !== strValue) {
				element.setAttribute(key, strValue);
			}
		},
		datasetProp(datasetObj) {
			// Process each dataset property
			for (const [key, value] of Object.entries(datasetObj)) {
				// Cast to string if needed
				const strValue = castToString(value);
				// Only update if the value has changed
				if (element.dataset[key] !== strValue) {
					element.dataset[key] = strValue;
				}
			}
		}
	});
	// Remove the attributes that are not in the vNode props
	for (const attr of attrsToRemove) {
		// Check if starts with 'on'
		if (!(attr.charCodeAt(0) === 111 && attr.charCodeAt(1) === 110)) {
			element.removeAttribute(attr);
		}
	}

	// Get all the prop keys
	const keys = Object.keys(props);
	// Default has events to false
	let hasEventProps = false;
	// Check each key to see if it starts with "on"
	for (let i = 0, len = keys.length; i < len; i++) {
		// Get the current key
		const key = keys[i];
		// Check if the key starts with "on"
		if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
			// Break here beacuse we only need one event prop to be true
			hasEventProps = true;
			break;
		}
	}
	// If we have event props, we need to delegate the events
	if (hasEventProps) {
		// Set the event key on the element if it doesn't exist
		element.dataset.eKey ??= generateKey();
		// Delegate the events to the root element
		delegateEvents(vNode, rootSelector, element.dataset.eKey);
	}
}
