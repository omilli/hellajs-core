import { getDefaultContext } from "./context";
import { type HNode, diff } from "./dom";
import { computed, effect } from "./reactive";

/**
 * Mounts a component to the DOM and sets up a reactive system to update it.
 *
 * @param hNodeEffect - A function that returns an HNode to be mounted
 * @param rootSelector - CSS selector for the root element where the component will be mounted, defaults to "#root"
 * @param context - Context object for the component, defaults to the result of getDefaultContext()
 *
 * @remarks
 * This function creates a reactive binding between the HNode returned by hNodeEffect
 * and the DOM. When dependencies of hNodeEffect change, the component will automatically
 * be re-rendered through the diff algorithm.
 */
export function mount(
	hNodeEffect: () => HNode,
	rootSelector = "#root",
	context = getDefaultContext(),
) {
	const component = computed(hNodeEffect);
	effect(() => {
		diff(component(), rootSelector, context);
	});
}
