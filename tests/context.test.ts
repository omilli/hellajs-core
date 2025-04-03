import { afterEach, describe, expect, test } from "bun:test";
import { context, getDefaultContext, signal, effect, computed, batch, untracked } from "../lib";
import { flushMicrotasks } from "./flush";

describe("Context", () => {
  describe("Basic Functionality", () => {
    test("creates a context with custom ID", () => {
      const ctx = context("test-context");
      expect(ctx.id).toBe("test-context");
    });

    test("creates a context with auto-generated ID when none provided", () => {
      const ctx = context();
      expect(ctx.id).toBeDefined();
      expect(typeof ctx.id).toBe("string");
      expect(ctx.id.startsWith("hellaContext")).toBe(true);
    });

    test("default context is accessible", () => {
      const defaultCtx = getDefaultContext();
      expect(defaultCtx).toBeDefined();
      expect(defaultCtx.id).toBe("hellaDefaultContext");
    });

    test("context provides all required reactive primitives", () => {
      const ctx = context("test");
      expect(typeof ctx.signal).toBe("function");
      expect(typeof ctx.effect).toBe("function");
      expect(typeof ctx.computed).toBe("function");
      expect(typeof ctx.batch).toBe("function");
      expect(typeof ctx.untracked).toBe("function");
      expect(typeof ctx.render).toBe("function");
      expect(typeof ctx.diff).toBe("function");
    });
  });

  describe("Isolation", () => {
    test("signals in different contexts are isolated", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(0);
      const count2 = ctx2.signal(0);

      // Update one signal
      count1.set(10);

      // Each signal has its own state
      expect(count1()).toBe(10);
      expect(count2()).toBe(0);

      // Update the other signal
      count2.set(20);

      // Verify isolation
      expect(count1()).toBe(10);
      expect(count2()).toBe(20);
    });

    test("effects in different contexts are isolated", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(0);
      const count2 = ctx2.signal(0);

      let effect1Runs = 0;
      let effect2Runs = 0;

      // Create effects in each context
      ctx1.effect(() => {
        count1();
        effect1Runs++;
      });

      ctx2.effect(() => {
        count2();
        effect2Runs++;
      });

      // Initial effect runs
      expect(effect1Runs).toBe(1);
      expect(effect2Runs).toBe(1);

      // Update signal in first context
      count1.set(10);

      // Only effect1 should run again
      expect(effect1Runs).toBe(2);
      expect(effect2Runs).toBe(1);

      // Update signal in second context
      count2.set(20);

      // Now effect2 should run again
      expect(effect1Runs).toBe(2);
      expect(effect2Runs).toBe(2);
    });

    test("computed values in different contexts are isolated", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(1);
      const count2 = ctx2.signal(2);

      let compute1Runs = 0;
      let compute2Runs = 0;

      const doubled1 = ctx1.computed(() => {
        compute1Runs++;
        return count1() * 2;
      });

      const doubled2 = ctx2.computed(() => {
        compute2Runs++;
        return count2() * 2;
      });

      // Initial computed values
      expect(doubled1()).toBe(2);
      expect(doubled2()).toBe(4);
      expect(compute1Runs).toBe(1);
      expect(compute2Runs).toBe(1);

      // Update signal in first context
      count1.set(5);

      // Only computed1 should recalculate
      expect(doubled1()).toBe(10);
      expect(doubled2()).toBe(4);
      expect(compute1Runs).toBe(2);
      expect(compute2Runs).toBe(1);

      // Update signal in second context
      count2.set(10);

      // Now computed2 should recalculate
      expect(doubled1()).toBe(10);
      expect(doubled2()).toBe(20);
      expect(compute1Runs).toBe(2);
      expect(compute2Runs).toBe(2);
    });

    test("batching is isolated by context", async () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(0);
      const count2 = ctx2.signal(0);

      let effect1Runs = 0;
      let effect2Runs = 0;

      ctx1.effect(() => {
        count1();
        effect1Runs++;
      });

      ctx2.effect(() => {
        count2();
        effect2Runs++;
      });

      // Initial runs
      expect(effect1Runs).toBe(1);
      expect(effect2Runs).toBe(1);

      // Batch update in context 1
      ctx1.batch(() => {
        count1.set(1);
        count1.set(2);
        count1.set(3);
      });

      await flushMicrotasks();

      // Only context 1 effect should run again
      expect(effect1Runs).toBe(2);
      expect(effect2Runs).toBe(1);
      expect(count1()).toBe(3);

      // Batch update in context 2
      ctx2.batch(() => {
        count2.set(1);
        count2.set(2);
        count2.set(3);
      });

      await flushMicrotasks();

      // Now context 2 effect should run again
      expect(effect1Runs).toBe(2);
      expect(effect2Runs).toBe(2);
      expect(count2()).toBe(3);
    });

    test("untracked is isolated by context", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      const count1 = ctx1.signal(0);
      const count2 = ctx2.signal(0);

      let effect1Runs = 0;
      let effect2Runs = 0;

      ctx1.effect(() => {
        ctx1.untracked(() => count1());
        effect1Runs++;
      });

      ctx2.effect(() => {
        count2(); // tracked normally
        effect2Runs++;
      });

      // Initial runs
      expect(effect1Runs).toBe(1);
      expect(effect2Runs).toBe(1);

      // Update count1 - should not trigger effect1 because it's untracked
      count1.set(10);
      expect(effect1Runs).toBe(1);

      // Update count2 - should trigger effect2
      count2.set(20);
      expect(effect2Runs).toBe(2);
    });
  });

  describe("Inter-context Behavior", () => {
    test("signals from one context can be read from another context", () => {
      const ctx1 = context("ctx1");
      const ctx2 = context("ctx2");

      // Create a signal in context 1
      const count = ctx1.signal(10);

      // Read it from context 2
      let effectRuns = 0;
      ctx2.effect(() => {
        count(); // accessing signal from ctx1
        effectRuns++;
      });

      // Initial run
      expect(effectRuns).toBe(1);

      // Updates to signal from ctx1 affect effect in ctx2
      count.set(20);
      expect(effectRuns).toBe(2);
    });

    test("global signals can be accessed from context-specific effects", () => {
      const ctx = context("local-ctx");

      // Create a global signal
      const globalCount = signal(0);

      // Create a local context effect that uses it
      let effectRuns = 0;
      ctx.effect(() => {
        globalCount();
        effectRuns++;
      });

      expect(effectRuns).toBe(1);

      // Update the global signal
      globalCount.set(10);

      // The local context effect should run
      expect(effectRuns).toBe(2);
    });

    test("context-specific signals can be accessed from global effects", () => {
      const ctx = context("local-ctx");

      // Create a context-specific signal
      const localCount = ctx.signal(0);

      // Create a global effect that uses it
      let effectRuns = 0;
      effect(() => {
        localCount();
        effectRuns++;
      });

      expect(effectRuns).toBe(1);

      // Update the local signal
      localCount.set(10);

      // The global effect should run
      expect(effectRuns).toBe(2);
    });
  });

  describe("Context Cleanup", () => {
    test("a signal from a disposed context still works but is detached", () => {
      // Create a context we'll replace
      let tempCtx = context("temp");

      // Create a signal in that context
      const tempSignal = tempCtx.signal(42);

      // Read initial value
      expect(tempSignal()).toBe(42);

      // Replace the context (simulating disposal)
      tempCtx = context("temp");

      // Signal should still work (it holds its own state)
      expect(tempSignal()).toBe(42);
      tempSignal.set(100);
      expect(tempSignal()).toBe(100);

      // But new signals in the new context are independent
      const newSignal = tempCtx.signal(0);
      expect(newSignal()).toBe(0);
    });
  });
});
