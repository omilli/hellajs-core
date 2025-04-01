import { getDefaultContext } from "./context";
import { diff } from "./diff";
import { computed, effect } from "./reactive";
import type { VNode } from "./types";

/**
 * Mounts a component to the DOM and sets up a reactive system to update it.
 *
 * @param vNodeEffect - A function that returns an VNode to be mounted
 * @param rootSelector - CSS selector for the root element where the component will be mounted, defaults to "#root"
 * @param context - Context object for the component, defaults to the result of getDefaultContext()
 *
 * @remarks
 * This function creates a reactive binding between the VNode returned by vNodeEffect
 * and the DOM. When dependencies of vNodeEffect change, the component will automatically
 * be re-rendered through the diff algorithm.
 */
export function mount(
	vNodeEffect: () => VNode,
	rootSelector = "#root",
	context = getDefaultContext(),
) {
	// Create a reactive component that will be updated when dependencies change
	const component = computed(vNodeEffect, { memo: true });
	// Create the effect that diffs the component when any singal dependancy changes
	effect(() => {
		diff(component(), rootSelector, context);
	});
}
