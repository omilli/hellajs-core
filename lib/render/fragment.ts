import { renderElement } from "../diff";
import type { Context, VNode } from "../types";

export function renderFragment(
	children: VNode["children"] = [],
	rootSelector: string,
	context: Context,
) {
	const fragment = document.createDocumentFragment();
	// Count the number of children in the existing fragment
	const childLen = children.length;
	// Append each child to the fragment
	for (let i = 0; i < childLen; i++) {
		fragment.appendChild(renderElement(children[i], rootSelector, context));
	}
	return fragment;
}
