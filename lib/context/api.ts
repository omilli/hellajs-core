import { diff } from "../diff";
import {
	NOT_TRACKING,
	batch,
	computed,
	effect,
	signal,
	untracked,
} from "../reactive";
import { render } from "../render";
import type { Context, RootContext } from "../types";
import { generateKey } from "../utils";
import { CONTEXT_STORE } from "./store";

/**
 * Creates and initializes a new reactive context.
 *
 * A context is the central container for managing reactive state and DOM operations.
 * It provides methods for creating and managing signals, effects, computed values,
 * and rendering to the DOM.
 *
 * @param id - Optional ID for new context. If not provided, a unique ID will be generated.
 * @returns A new Context object with initialized reactive state management and DOM utilities.
 *
 */
export function context(id = `hellaContext${generateKey()}`): Context {
	// Create a new context object
	const contextState: Context = {
		id,
		signal: (...args) => signal(...args, contextState),
		effect: (...args) => effect(...args, contextState),
		computed: (fn) => computed(fn),
		batch: (fn) => batch(fn, contextState),
		untracked: (fn) => untracked(fn, contextState),
		render: (...args) => render(...args, contextState),
		diff: (...args) => diff(...args, contextState),
		dom: {
			rootStore: new Map(),
		},
		reactive: {
			activeTracker: NOT_TRACKING,
			pendingNotifications: [],
			pendingRegistry: new Set(),
			executionContext: [],
			effectDependencies: new Map(),
			batchDepth: 0,
			currentExecutingEffect: null,
			parentChildEffectsMap: new WeakMap(),
		},
	};

	// Store the context in the global context store
	CONTEXT_STORE.set(id, contextState);

	// Return the context object
	return CONTEXT_STORE.get(id) as Context;
}

/**
 * Retrieves the default context from the global scope.
 *
 * This function ensures that a single shared context instance exists in the global scope.
 * If the context doesn't already exist, it creates a new one using the `context()` function
 * and stores it in the global object under the key "domContext".
 *
 * @returns The default context instance.
 */
export function getDefaultContext(): Context {
	// Default key to attach the context to the global object
	const key = "hellaDefaultContext";

	// Check if the context already exists in the global object
	// If it doesn't, create a new context and store it
	if (!CONTEXT_STORE.get(key)) {
		CONTEXT_STORE.set(key, context(key));
	}

	// Return the context instance
	return CONTEXT_STORE.get(key) as Context;
}

/**
 * Retrieves or initializes a root context for the specified selector.
 *
 * @param rootSelector - The selector string identifying the root element
 * @param context - Object containing the context
 * @returns The root context associated with the given selector
 */
export function getRootContext(
	rootSelector: string,
	context = getDefaultContext(),
): RootContext {
	const { rootStore } = context.dom;
	// Check if the root store already has a context for the given selector
	// If not, create a new root context and store it
	if (!rootStore.has(rootSelector)) {
		rootStore.set(rootSelector, {
			events: {
				delegates: new Set(),
				handlers: new Map(),
				listeners: new Map(),
			},
		});
	}
	return rootStore.get(rootSelector) as RootContext;
}
