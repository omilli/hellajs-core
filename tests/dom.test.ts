import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { context, diff, render, signal, VNode } from "../lib";

// Helper functions for testing
function createContainer() {
  const container = document.createElement("div");
  container.id = "test-container";
  document.body.appendChild(container);
  return container;
}

function removeContainer() {
  const container = document.getElementById("test-container");
  if (container) {
    document.body.removeChild(container);
  }
}

function getContainer() {
  return document.getElementById("test-container");
}

describe("DOM Rendering and Diffing", () => {
  beforeEach(() => {
    createContainer();
  });

  afterEach(() => {
    removeContainer();
  });

  describe("Basic Rendering", () => {
    test("renders a simple element", () => {
      const vNode: VNode = { type: "div", props: { className: "test" }, children: ["Hello World"] };
      render(vNode, "#test-container");

      const container = getContainer();
      expect(container?.childNodes.length).toBe(1);
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.tagName).toBe("DIV");
      expect(div.className).toBe("test");
      expect(div.textContent).toBe("Hello World");
    });

    test("renders nested elements", () => {
      const vNode: VNode = {
        type: "div",
        props: { className: "parent" },
        children: [
          {
            type: "span",
            props: { className: "child" },
            children: ["Child Text"]
          }
        ]
      };

      render(vNode, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.tagName).toBe("DIV");
      expect(div.className).toBe("parent");

      const span = div.childNodes[0] as HTMLElement;
      expect(span.tagName).toBe("SPAN");
      expect(span.className).toBe("child");
      expect(span.textContent).toBe("Child Text");
    });

    test("renders fragments", () => {
      const vNode: VNode = {
        children: [
          { type: "div", children: ["First"] },
          { type: "div", children: ["Second"] }
        ]
      };

      render(vNode, "#test-container");

      const container = getContainer();
      expect(container?.childNodes.length).toBe(2);
      expect((container?.childNodes[0] as HTMLElement).textContent).toBe("First");
      expect((container?.childNodes[1] as HTMLElement).textContent).toBe("Second");
    });
  });

  describe("Diffing and Updating", () => {
    test("updates text content", () => {
      // Initial render
      const vNode1: VNode = { type: "div", children: ["Initial Text"] };
      render(vNode1, "#test-container");

      // Update
      const vNode2: VNode = { type: "div", children: ["Updated Text"] };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.textContent).toBe("Updated Text");
    });

    test("updates attributes", () => {
      // Initial render
      const vNode1: VNode = { type: "div", props: { className: "initial", id: "test-id" } };
      render(vNode1, "#test-container");

      // Update
      const vNode2: VNode = { type: "div", props: { className: "updated", dataset: { test: "value" } } };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.className).toBe("updated");
      expect(div.id).toBe(""); // id should be removed
      expect(div.dataset.test).toBe("value"); // data-test should be added
    });

    test("adds new elements", () => {
      // Initial render
      const vNode1: VNode = { type: "div", children: [{ type: "span", children: ["First"] }] };
      render(vNode1, "#test-container");

      // Update with additional element
      const vNode2: VNode = {
        type: "div",
        children: [
          { type: "span", children: ["First"] },
          { type: "span", children: ["Second"] }
        ]
      };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.childNodes.length).toBe(2);
      expect((div.childNodes[0] as HTMLElement).textContent).toBe("First");
      expect((div.childNodes[1] as HTMLElement).textContent).toBe("Second");
    });

    test("removes elements", () => {
      // Initial render with two children
      const vNode1: VNode = {
        type: "div",
        children: [
          { type: "span", children: ["First"] },
          { type: "span", children: ["Second"] }
        ]
      };
      render(vNode1, "#test-container");

      // Update with one child removed
      const vNode2: VNode = { type: "div", children: [{ type: "span", children: ["First"] }] };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      expect(div.childNodes.length).toBe(1);
      expect((div.childNodes[0] as HTMLElement).textContent).toBe("First");
    });

    test("replaces elements of different types", () => {
      // Initial render with span
      const vNode1: VNode = { type: "div", children: [{ type: "span", children: ["Text"] }] };
      render(vNode1, "#test-container");

      // Update replacing span with p
      const vNode2: VNode = { type: "div", children: [{ type: "p", children: ["Text"] }] };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      const p = div.childNodes[0] as HTMLElement;
      expect(p.tagName).toBe("P");
      expect(p.textContent).toBe("Text");
    });
  });

  describe("Event Handling", () => {
    test("attaches event handlers", () => {
      let clicked = false;

      const vNode: VNode = {
        type: "button",
        props: {
          onclick: () => { clicked = true; }
        },
        children: ["Click Me"]
      };

      render(vNode, "#test-container");

      const container = getContainer();
      const button = container?.childNodes[0] as HTMLButtonElement;

      // Simulate click
      button.click();

      expect(clicked).toBe(true);
    });

    test("updates event handlers", () => {
      let counter = 0;

      // Initial handler
      const vNode1: VNode = {
        type: "button",
        props: {
          onclick: () => { counter = 1; }
        },
        children: ["Click Me"]
      };
      render(vNode1, "#test-container");

      // Updated handler
      const vNode2: VNode = {
        type: "button",
        props: {
          onclick: () => { counter = 2; }
        },
        children: ["Click Me"]
      };
      diff(vNode2, "#test-container");

      const container = getContainer();
      const button = container?.childNodes[0] as HTMLButtonElement;

      // Simulate click with updated handler
      button.click();

      expect(counter).toBe(2);
    });
  });

  describe("Fragment Handling", () => {
    test("renders fragment children", () => {
      const vNode: VNode = {
        children: [
          "Text Node",
          { type: "div", children: ["Element Node"] }
        ]
      };

      render(vNode, "#test-container");

      const container = getContainer();
      expect(container?.childNodes.length).toBe(2);
      expect(container?.childNodes[0].textContent).toBe("Text Node");
      expect((container?.childNodes[1] as HTMLElement).textContent).toBe("Element Node");
    });

    test("updates fragment children", () => {
      // Initial fragment render
      const vNode1: VNode = {
        children: [
          { type: "div", children: ["First"] },
          { type: "div", children: ["Second"] }
        ]
      };
      render(vNode1, "#test-container");

      // Update fragment
      const vNode2: VNode = {
        children: [
          { type: "div", children: ["First Updated"] },
          { type: "div", children: ["Second Updated"] },
          { type: "div", children: ["Third (New)"] }
        ]
      };
      diff(vNode2, "#test-container");

      const container = getContainer();
      expect(container?.childNodes.length).toBe(3);
      expect((container?.childNodes[0] as HTMLElement).textContent).toBe("First Updated");
      expect((container?.childNodes[1] as HTMLElement).textContent).toBe("Second Updated");
      expect((container?.childNodes[2] as HTMLElement).textContent).toBe("Third (New)");
    });
  });

  describe("Integration with Reactivity", () => {
    test("updates DOM when signal changes", () => {
      const count = signal(0);

      const renderCount = `Count: ${count()}`;

      const vNode: VNode = {
        type: "div",
        children: [
          {
            type: "span",
            children: [renderCount]
          },
          {
            type: "button",
            props: {
              onclick: () => count.set(count() + 1)
            },
            children: ["Increment"]
          }
        ]
      };

      render(vNode, "#test-container");

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;
      const span = div.childNodes[0] as HTMLElement;
      const button = div.childNodes[1] as HTMLButtonElement;

      // Initial state
      expect(span.textContent).toBe("Count: 0");

      // Increment count
      button.click();

      // Check that the DOM was updated
      expect(span.textContent).toBe("Count: 1");
    });
  });

  describe("Context-specific Rendering", () => {
    test("renders with custom context", () => {
      const ctx = context("custom");
      const count = ctx.signal(0);

      const renderCount = `Count: ${count()}`;

      const vNode: VNode = {
        type: "div",
        children: [renderCount]
      };

      render(vNode, "#test-container", ctx);

      const container = getContainer();
      const div = container?.childNodes[0] as HTMLElement;

      // Initial state
      expect(div.textContent).toBe("Count: 0");

      // Update count
      count.set(42);

      // Check that the DOM was updated
      expect(div.textContent).toBe("Count: 42");
    });

    test("isolates rendering between contexts", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(0);
      const count2 = ctx2.signal(100);

      // First render with ctx1
      const vNode1: VNode = {
        type: "div",
        children: [`Count 1: ${count1()}`]
      };
      render(vNode1, "#test-container", ctx1);

      // Initial state with ctx1
      let div = getContainer()?.childNodes[0] as HTMLElement;
      expect(div.textContent).toBe("Count 1: 0");

      // Second render with ctx2
      const vNode2: VNode = {
        type: "div",
        children: [`Count 2: ${count2()}`]
      };
      render(vNode2, "#test-container", ctx2);

      // State with ctx2
      div = getContainer()?.childNodes[0] as HTMLElement;
      expect(div.textContent).toBe("Count 2: 100");

      // Update count1 (should not affect current DOM as we're using ctx2)
      count1.set(50);
      expect(div.textContent).toBe("Count 2: 100");

      // Update count2 (should update DOM since we're using ctx2)
      count2.set(200);
      expect(div.textContent).toBe("Count 2: 200");
    });
  });
});
