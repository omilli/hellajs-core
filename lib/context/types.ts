import type { EventFn, HNode } from "../dom";
import type {
	EffectFn,
	EffectOptions,
	Signal,
	SignalOptions,
	SignalValue,
} from "../reactive/types";

/**
 * Represents the global context that extends the Window and globalThis objects.
 * Allows for accessing context objects with string keys.
 */
export type GlobalContext = (Window & typeof globalThis) & {
	[key: string]: Context;
};

/**
 * Context provides a set of utilities for managing reactivity, state, and DOM rendering.
 */
export type Context = {
	/**
	 * Unique identifier for the context
	 */
	id: string;
	/**
	 * Creates a reactive signal with the specified initial value
	 */
	signal: <T>(initialValue: T, options?: SignalOptions<T>) => Signal<T>;
	/**
	 * Registers a side effect function that tracks reactive dependencies
	 */
	effect: (fn: EffectFn, options?: EffectOptions) => void;
	/**
	 * Creates a read-only signal derived from reactive dependencies
	 */
	computed: <T>(fn: () => T) => SignalValue<T>;
	/**
	 * Executes a function without tracking reactive dependencies
	 */
	untracked: <T>(fn: () => T) => T;
	/**
	 * Executes a function in batch mode, delaying updates until completion
	 */
	batch: (fn: () => void) => void;
	/**
	 * Renders a virtual node to the DOM at the specified selector
	 */
	render: (element: HNode, rootSelector: string) => void;
	/**
	 * Updates an existing DOM node with changes from a virtual node
	 */
	diff: (element: HNode, rootSelector: string) => void;
	/**
	 * Provides reactive context utilities
	 */
	reactive: ReactiveContext;
	/**
	 * Provides DOM manipulation utilities
	 */
	dom: DOMContext;
};

/**
 * Provides access to DOM-related data and utilities.
 */

export interface DOMContext {
	/**
	 * Tracks all the root elements where components are mounted
	 */
	rootStore: RootStore;
}

/**
 * A mapping from CSS selectors (e.g "#root") to their corresponding RootContext.
 */
export type RootStore = Map<string, RootContext>;

/**
 * Represents the root context for a specific DOM element.
 */
export type RootContext = {
	/**
	 * Manages event delegation for a specific root element
	 */
	events: {
		/**
		 * A mapping of event types (e.g "click") to their corresponding event handlers.
		 */
		delegates: Set<string>;
		/**
		 * A mapping of event types to their corresponding event handlers.
		 */
		handlers: Map<string, Map<string, EventFn>>;
		/**
		 * A mapping of element keys to their corresponding event handlers.
		 */
		listeners: Map<string, EventListener>;
	};
};

export interface ReactiveContext {
	/**
	 * The currently active effect tracker.
	 */
	activeTracker: EffectFn | symbol;
	/**
	 * A list of effects that are pending execution.
	 */
	pendingNotifications: EffectFn[];
	/**
	 * A set of effects that are pending execution, used for deduplication.
	 */
	pendingRegistry: Set<EffectFn>;
	/**
	 * A stack of effects that are currently being executed.
	 */
	executionContext: EffectFn[];
	/**
	 * A map of effects to their dependencies.
	 */
	effectDependencies: Map<EffectFn, Set<unknown>>;
	/**
	 * The current batch depth.
	 */
	batchDepth: number;
	/**
	 * Currently executing parent effect
	 */
	currentExecutingEffect: EffectFn | null;
	/**
	 * Map of parent effects to their child effects
	 */
	parentChildEffectsMap: WeakMap<EffectFn, Set<EffectFn>>;
}
