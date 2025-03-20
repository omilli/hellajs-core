import { delegateEvents } from "./events";
import type { DiffContext, HellaElement, RenderedComponent } from "./types";

// Add at the top of your file

// Simple element pool implementation
const elementPool = (() => {
	const pools: Record<string, HTMLElement[]> = {};
	const maxPoolSize = 100; // Adjust based on your app's needs

	function getElement(type: string): HTMLElement | null {
		if (!pools[type] || pools[type].length === 0) return null;
		return pools[type].pop()!;
	}

	function releaseElement(element: HTMLElement): void {
		const type = element.tagName.toLowerCase();
		if (!pools[type]) pools[type] = [];

		// Clean the element before storing
		element.className = "";
		element.removeAttribute("style");

		// Remove all attributes
		while (element.attributes.length > 0) {
			element.removeAttribute(element.attributes[0].name);
		}

		// Remove all children
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		// Remove all event listeners (would need to track them elsewhere)

		// Only store if we haven't reached max capacity
		if (pools[type].length < maxPoolSize) {
			pools[type].push(element);
		}
	}

	function releaseElementAndChildren(element: HTMLElement): void {
		// First, recursively release all child elements
		Array.from(element.children).forEach((child) => {
			releaseElementAndChildren(child as HTMLElement);
		});

		releaseElement(element);
	}

	return {
		getElement,
		releaseElement,
		releaseElementAndChildren,
		clearPools: () => Object.keys(pools).forEach((key) => (pools[key] = [])),
	};
})();

const diffContextManager = (() => {
	const componentCache = new Map<string, RenderedComponent>();
	const pendingUpdates = new Map<string, { element: HellaElement }>();
	let frameRequested = false;

	function processUpdates() {
		frameRequested = false;

		// Make a copy to avoid modification issues during iteration
		const updates = new Map(pendingUpdates);
		pendingUpdates.clear();

		updates.forEach(({ element }, selector) => {
			const container = document.querySelector(selector);
			if (!container) return;

			const cached = componentCache.get(selector);
			let domElement: HTMLElement;

			if (cached) {
				domElement = diffElement(
					cached.props,
					element,
					container as HTMLElement,
					0,
				) as HTMLElement;
			} else {
				domElement = createDOMElement(element) as HTMLElement;
				container.innerHTML = "";
				container.appendChild(domElement);
			}

			componentCache.set(selector, {
				element: domElement,
				props: element,
				pending: false,
			});
		});
	}

	function scheduleUpdate(selector: string, element: HellaElement) {
		pendingUpdates.set(selector, { element });

		if (!frameRequested) {
			frameRequested = true;
			requestAnimationFrame(processUpdates);
		}
	}

	return {
		getCache: () => componentCache,
		getComponent: (selector: string) => componentCache.get(selector),
		setComponent: (selector: string, component: RenderedComponent) => {
			componentCache.set(selector, component);
		},
		scheduleUpdate,
		clearCache: () => componentCache.clear(),
		flushUpdates: () => {
			if (frameRequested) {
				cancelAnimationFrame(frameRequested as unknown as number);
				processUpdates();
			}
		},
	};
})();

export function diff(
	element: HellaElement,
	selector: string,
	options: { sync?: boolean } = {},
): RenderedComponent {
	const container = document.querySelector(selector);
	if (!container)
		throw new Error(`Container with selector "${selector}" not found`);

	if (options.sync) {
		// Synchronous update (original behavior)
		const cached = diffContextManager.getComponent(selector);
		let domElement: HTMLElement;

		if (cached) {
			domElement = diffElement(
				cached.props,
				element,
				container as HTMLElement,
				0,
			) as HTMLElement;
		} else {
			domElement = createDOMElement(element) as HTMLElement;
			container.innerHTML = "";
			container.appendChild(domElement);
		}

		const component = { element: domElement, props: element, pending: false };
		diffContextManager.setComponent(selector, component);
		return component;
	} else {
		// Asynchronous update using rAF
		diffContextManager.scheduleUpdate(selector, element);

		// Return a placeholder or the cached component
		const cached = diffContextManager.getComponent(selector);
		return (
			cached || {
				element: container as HTMLElement,
				props: element,
				pending: true,
			}
		);
	}
}

export function createDiffContext(): DiffContext {
	const componentCache = new Map<string, RenderedComponent>();

	return {
		componentCache,
		clearCache: () => componentCache.clear(),
	};
}

function diffElement(
	oldVNode: HellaElement | string | null,
	newVNode: HellaElement | string,
	parent: HTMLElement,
	index = 0,
): HTMLElement | Text {
	if (oldVNode === null) {
		const newNode = createDOMElement(newVNode);
		parent.appendChild(newNode);
		return newNode;
	}

	const currentNode = parent.childNodes[index] as HTMLElement | Text;

	if (typeof oldVNode === "string" && typeof newVNode === "string") {
		if (oldVNode !== newVNode) currentNode.textContent = newVNode;
		return currentNode;
	}

	if (
		typeof oldVNode !== typeof newVNode ||
		(typeof oldVNode !== "string" &&
			typeof newVNode !== "string" &&
			oldVNode.type !== newVNode.type)
	) {
		const newNode = createDOMElement(newVNode);
		parent.replaceChild(newNode, currentNode);
		return newNode;
	}

	if (typeof oldVNode !== "string" && typeof newVNode !== "string") {
		updateProps(currentNode as HTMLElement, oldVNode.props, newVNode.props);

		const oldChildren = oldVNode.children;
		const newChildren = newVNode.children;

		if (
			oldChildren.length &&
			newChildren.length &&
			typeof oldChildren[0] !== "string" &&
			typeof newChildren[0] !== "string" &&
			oldChildren.some(
				(child) => typeof child !== "string" && child.props?._key !== undefined,
			)
		) {
			diffKeyedChildren(oldChildren, newChildren, currentNode as HTMLElement);
			return currentNode;
		}

		while (currentNode.childNodes.length > newChildren.length) {
			const removedNode = currentNode.lastChild as HTMLElement;
			currentNode.removeChild(removedNode);
			if (removedNode.nodeType === Node.ELEMENT_NODE) {
				elementPool.releaseElementAndChildren(removedNode);
			}
		}

		for (let i = 0; i < newChildren.length; i++) {
			if (i < oldChildren.length) {
				diffElement(
					oldChildren[i],
					newChildren[i],
					currentNode as HTMLElement,
					i,
				);
			} else {
				currentNode.appendChild(createDOMElement(newChildren[i]));
			}
		}
	}

	return currentNode;
}

function diffKeyedChildren(
	oldChildren: (HellaElement | string)[],
	newChildren: (HellaElement | string)[],
	parent: HTMLElement,
): void {
	const oldKeyMap = new Map();
	oldChildren.forEach((child, i) => {
		if (typeof child !== "string" && child.props?._key !== undefined) {
			oldKeyMap.set(child.props._key, {
				vnode: child,
				element: parent.childNodes[i],
				index: i,
			});
		}
	});

	const newKeyMap = new Map();
	newChildren.forEach((child, i) => {
		if (typeof child !== "string" && child.props?._key !== undefined) {
			newKeyMap.set(child.props._key, i);
		}
	});

	const processedKeys = new Set();
	const newPositions = new Map();

	newChildren.forEach((newChild, newIndex) => {
		if (typeof newChild === "string" || !newChild.props?._key) return;

		const key = newChild.props._key;
		const oldEntry = oldKeyMap.get(key);

		if (oldEntry) {
			processedKeys.add(key);
			const oldVNode = oldEntry.vnode;
			const oldElement = oldEntry.element;

			updateProps(oldElement as HTMLElement, oldVNode.props, newChild.props);

			if (oldVNode.children.length || newChild.children.length) {
				for (let i = 0; i < newChild.children.length; i++) {
					if (i < oldVNode.children.length) {
						diffElement(
							oldVNode.children[i],
							newChild.children[i],
							oldElement as HTMLElement,
							i,
						);
					} else {
						oldElement.appendChild(createDOMElement(newChild.children[i]));
					}
				}
				while (oldElement.childNodes.length > newChild.children.length) {
					oldElement.removeChild(oldElement.lastChild!);
				}
			}
			newPositions.set(newIndex, oldElement);
		}
	});

	newChildren.forEach((newChild, newIndex) => {
		if (typeof newChild === "string") {
			newPositions.set(newIndex, document.createTextNode(newChild));
			return;
		}
		if (!newChild.props?._key || processedKeys.has(newChild.props._key)) return;
		newPositions.set(newIndex, createDOMElement(newChild));
	});

	const fragment = document.createDocumentFragment();
	for (let i = 0; i < newChildren.length; i++) {
		const child = newChildren[i];
		if (typeof child === "string") {
			fragment.appendChild(document.createTextNode(child));
		} else if (!child.props._key) {
			fragment.appendChild(createDOMElement(child));
		} else if (newPositions.get(i)) {
			fragment.appendChild(newPositions.get(i));
		}
	}

	parent.innerHTML = ""; // Replace with:
	while (parent.firstChild) {
		const child = parent.firstChild as HTMLElement;
		parent.removeChild(child);
		if (child.nodeType === Node.ELEMENT_NODE) {
			elementPool.releaseElementAndChildren(child);
		}
	}
	parent.appendChild(fragment);
}

function updateProps(
	element: HTMLElement,
	oldProps: Record<string, any>,
	newProps: Record<string, any>,
): void {
	// First handle regular attributes
	Object.keys(oldProps).forEach((key) => {
		if (!(key in newProps) && !key.startsWith("on") && key !== "_key") {
			if (key === "className") element.className = "";
			else if (key === "style") element.removeAttribute("style");
			else element.removeAttribute(key);
		}
	});

	Object.entries(newProps).forEach(([key, value]) => {
		if (oldProps[key] === value || key === "_key" || key.startsWith("on"))
			return;

		if (key === "className") element.className = value;
		else if (key === "style" && typeof value === "object") {
			Object.keys(oldProps.style || {}).forEach((styleKey) => {
				if (!(styleKey in value)) (element.style as any)[styleKey] = "";
			});
			Object.entries(value).forEach(([styleKey, styleValue]) => {
				if ((oldProps.style || {})[styleKey] !== styleValue) {
					(element.style as any)[styleKey] = styleValue;
				}
			});
		} else {
			element.setAttribute(key, value);
		}
	});

	// Now handle events separately
	delegateEvents(element, newProps);
}

// Then modify createDOMElement to use the pool

function createDOMElement(element: HellaElement | string): HTMLElement | Text {
	if (typeof element === "string") {
		return document.createTextNode(element);
	}

	const { type, props, children } = element;
	const domElement = document.createElement(type);

	// Apply props
	Object.entries(props).forEach(([key, value]) => {
		if (key === "className") {
			domElement.className = value;
		} else if (key === "style" && typeof value === "object") {
			Object.entries(value).forEach(([styleKey, styleValue]) => {
				(domElement.style as any)[styleKey] = styleValue;
			});
		} else if (!key.startsWith("on") && key !== "_key") {
			domElement.setAttribute(key, value);
		}
	});

	// Attach event handlers
	delegateEvents(domElement, props);

	// Append children correctly
	children.forEach((child) => {
		const childNode = createDOMElement(child);
		domElement.appendChild(childNode);
	});

	return domElement;
}
