import type { EventFn, HNode } from "../dom";
import type {
	EffectFn,
	EffectOptions,
	Signal,
	SignalOptions,
	SignalValue,
} from "../reactive/types";

export type GlobalContext = (Window & typeof globalThis) & {
	[key: string]: Context;
};

export type Context = {
	id: string;
	signal: <T>(initialValue: T, options?: SignalOptions<T>) => Signal<T>;
	effect: (fn: EffectFn, options?: EffectOptions) => void;
	computed: <T>(fn: () => T) => SignalValue<T>;
	untracked: <T>(fn: () => T) => T;
	batch: (fn: () => void) => void;
	render: (element: HNode, rootSelector: string) => void;
	diff: (element: HNode, rootSelector: string) => void;
	reactive: ReactiveContext;
	dom: DOMContext;
};

export interface DOMContext {
	rootStore: RootStore;
}

export type RootStore = Map<string, RootContext>;

export type RootContext = {
	events: {
		delegates: Set<string>;
		listeners: Map<string, Map<string, EventFn>>;
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
	 * A set of all effects in this context.
	 */
	effects: Set<EffectFn>;
	/**
	 * A weak set of all signals in this context.
	 */
	signals: WeakSet<WeakKey>;
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
