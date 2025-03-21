import type { ContextState, RootContext } from "./context";
import { getRootContext } from "./context";
import { delegateEvents } from "./events";
import { propHandler } from "./render/utils";
import type { HNode } from "./types";
import { generateKey } from "./utils";

/**
 * Main diffing function that compares a new virtual DOM tree with the existing DOM
 * and performs minimal updates to bring the DOM in sync with the virtual DOM
 */
export function diff(
  newHNode: HNode,
  rootSelector: string,
  context: ContextState,
): HTMLElement | Text | DocumentFragment {
  const rootElement = document.querySelector(rootSelector);
  if (!rootElement) {
      throw new Error(`Root element not found: ${rootSelector}`);
  }

  const rootContext = getRootContext(rootSelector, context);
  
  // Instead of recreating everything, diff the children of the root
  if (rootElement.childNodes.length === 0) {
    // First render case - just create and append
    const newElement = renderNewElement(newHNode, rootSelector, context);
    rootElement.appendChild(newElement);
    return newElement instanceof DocumentFragment ? rootElement as HTMLElement : newElement;
  } else {
    // Compare existing children with new virtual DOM
    diffChildren(
      Array.from(rootElement.childNodes) as (HTMLElement | Text)[],
      [newHNode],
      rootElement,
      rootContext,
      rootSelector,
      context
    );
    return rootElement as HTMLElement;
  }
}

/**
 * Compares an existing DOM node with a new virtual node and updates as needed
 */
function diffNode(
  domNode: HTMLElement | Text,
  hNode: HNode | string | number,
  parentElement: Element | DocumentFragment,
  rootContext: RootContext,
  rootSelector: string,
  context: ContextState,
): HTMLElement | Text | DocumentFragment {
  // Handle text nodes
  if (typeof hNode === "string" || typeof hNode === "number") {
    if (domNode.nodeType === Node.TEXT_NODE) {
      // Update text content if different
      if (domNode.textContent !== String(hNode)) {
        domNode.textContent = String(hNode);
      }
      return domNode;
    } else {
      // Replace with a new text node
      const newNode = document.createTextNode(String(hNode));
      parentElement.replaceChild(newNode, domNode);
      return newNode;
    }
  }

  // Handle fragment (when type is undefined or null)
  if (!hNode.type) {
    if (domNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // Update fragment contents
      diffChildren(
        Array.from(domNode.childNodes) as (HTMLElement | Text)[],
        hNode.children || [],
        domNode as Element,
        rootContext,
        rootSelector,
        context
      );
      return domNode;
    } else {
      // Replace with a fragment
      const fragment = document.createDocumentFragment();
      (hNode.children || []).forEach(child => {
        fragment.appendChild(renderNewElement(child, rootSelector, context));
      });
      parentElement.replaceChild(fragment, domNode);
      return fragment;
    }
  }

  // Handle regular elements
  if (domNode.nodeType === Node.ELEMENT_NODE) {
    const element = domNode as HTMLElement;
    // If node types match, update the element
    if (element.tagName.toLowerCase() === hNode.type.toLowerCase()) {
      return updateElement(element, hNode, rootContext, rootSelector, context);
    }
  }

  // Types don't match, create a new element and replace
  const newElement = renderNewElement(hNode, rootSelector, context);
  parentElement.replaceChild(newElement, domNode);
  return newElement;
}

/**
 * Updates an existing element with new props and children
 */
function updateElement(
  element: HTMLElement,
  hNode: HNode,
  rootContext: RootContext,
  rootSelector: string,
  context: ContextState,
): HTMLElement {
  // Update props
  updateProps(element, hNode.props || {});

  // Update event handlers
  const hasEventProps = Object.keys(hNode.props || {}).some((key) =>
    key.startsWith("on"),
  );
  if (hasEventProps) {
    if (!element.dataset.eKey) {
      element.dataset.eKey = generateKey();
    }
    delegateEvents(hNode, rootSelector, element.dataset.eKey);
  }

  // Store the updated hNode reference
  if (element.dataset.hKey && rootContext.elements.has(element.dataset.hKey)) {
    rootContext.elements.set(element.dataset.hKey, {
      element,
      hNode,
    });
  } else {
    const key = element.dataset.hKey || generateKey();
    element.dataset.hKey = key;
    rootContext.elements.set(key, {
      element,
      hNode,
    });
  }

  // Update children
  diffChildren(
    Array.from(element.childNodes) as (HTMLElement | Text)[],
    hNode.children || [],
    element,
    rootContext,
    rootSelector,
    context,
  );

  return element;
}

/**
 * Compares and updates children of an element
 */
function diffChildren(
  domChildren: (HTMLElement | Text)[],
  hNodeChildren: (HNode | string | number)[],
  parentElement: Element | DocumentFragment,
  rootContext: RootContext,
  rootSelector: string,
  context: ContextState,
): void {
  // Handle case where we have more DOM children than virtual children
  while (domChildren.length > hNodeChildren.length) {
    parentElement.removeChild(parentElement.lastChild!);
    domChildren.pop();
  }
  
  // Process each child
  for (let i = 0; i < hNodeChildren.length; i++) {
    const hNodeChild = hNodeChildren[i];
    
    if (i < domChildren.length) {
      // Update existing node
      diffNode(
        domChildren[i],
        hNodeChild,
        parentElement,
        rootContext,
        rootSelector,
        context,
      );
    } else {
      // Add new node
      const newNode = renderNewElement(hNodeChild, rootSelector, context);
      parentElement.appendChild(newNode);
    }
  }
}

/**
 * Updates the props/attributes of an element
 */
function updateProps(element: HTMLElement, props: HNode["props"] = {}): void {
  // First, collect current attributes to detect removed ones
  const currentAttrs = Array.from(element.attributes)
    .filter((attr) => !attr.name.startsWith("data-") && attr.name !== "class")
    .map((attr) => attr.name);

  const newAttrs = new Set<string>();

  // Apply new props
  propHandler(props, {
    classProp(className) {
      if (element.className !== className) {
        element.className = className;
      }
      newAttrs.add("class");
    },
    boolProp(key) {
      if (!element.hasAttribute(key)) {
        element.setAttribute(key, "");
      }
      newAttrs.add(key);
    },
    regularProp(key, value) {
      const strValue = String(value);
      if (element.getAttribute(key) !== strValue) {
        element.setAttribute(key, strValue);
      }
      newAttrs.add(key);
    },
  });

  // Remove attributes that are no longer present
  for (const attr of currentAttrs) {
    if (!newAttrs.has(attr) && !attr.startsWith("on")) {
      element.removeAttribute(attr);
    }
  }
}

/**
 * Creates a new DOM element for a virtual node
 */
function renderNewElement(
  hNode: HNode | string | number,
  rootSelector: string,
  context: ContextState,
): HTMLElement | Text | DocumentFragment {
  if (typeof hNode === "string" || typeof hNode === "number") {
    return document.createTextNode(String(hNode));
  }

  if (!hNode.type) {
    const fragment = document.createDocumentFragment();
    (hNode.children || []).forEach((child) => {
      const childElement = renderNewElement(child, rootSelector, context);
      fragment.appendChild(childElement);
    });
    return fragment;
  }

  const element = document.createElement(hNode.type);
  const elementKey = generateKey();
  element.dataset.hKey = elementKey;

  // Apply props
  updateProps(element, hNode.props);

  // Set up event handlers
  const hasEventProps = Object.keys(hNode.props || {}).some((key) =>
    key.startsWith("on"),
  );
  if (hasEventProps) {
    element.dataset.eKey = generateKey();
    delegateEvents(hNode, rootSelector, element.dataset.eKey);
  }

  // Store the element
  const rootContext = getRootContext(rootSelector, context);
  rootContext.elements.set(elementKey, {
    element,
    hNode,
  });

  // Process children
  (hNode.children || []).forEach((child) => {
    const childElement = renderNewElement(child, rootSelector, context);
    element.appendChild(childElement);
  });

  return element;
}