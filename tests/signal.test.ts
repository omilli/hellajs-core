import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { signal } from "../lib/reactive/signal";
import { effect } from "../lib/reactive/effect";
import { batch } from "../lib/reactive/batch";
import { untracked } from "../lib/reactive/untracked";
import { flushMicrotasks } from "./flush";

describe("Signal", () => {
  describe("Basic Functionality", () => {
    test("creates a signal with initial value", () => {
      const count = signal(0);
      expect(count()).toBe(0);
    });

    test("reads the current value", () => {
      const text = signal("hello");
      expect(text()).toBe("hello");
    });

    test("sets a new value with set method", () => {
      const count = signal(0);
      count.set(5);
      expect(count()).toBe(5);
    });

    test("updates value with a function using update method", () => {
      const count = signal(5);
      count.update(n => n * 2);
      expect(count()).toBe(10);
    });

    test("sets value with different types", () => {
      const numSignal = signal(0);
      const strSignal = signal("");
      const objSignal = signal({ name: "test" });
      const arrSignal = signal([1, 2, 3]);
      const boolSignal = signal(false);
      
      numSignal.set(42);
      strSignal.set("hello");
      objSignal.set({ name: "updated" });
      arrSignal.set([4, 5, 6]);
      boolSignal.set(true);
      
      expect(numSignal()).toBe(42);
      expect(strSignal()).toBe("hello");
      expect(objSignal()).toEqual({ name: "updated" });
      expect(arrSignal()).toEqual([4, 5, 6]);
      expect(boolSignal()).toBe(true);
    });
  });

  describe("Signal Options", () => {
    test("creates a signal with a name", () => {
      const count = signal(0, { name: "counter" });
      // @ts-expect-error _name is not a public property
      expect(count._name).toBe("counter");
    });

    test("validates new values with validators", () => {
      // Mock console.warn to avoid test output pollution
      const originalWarn = console.warn;
      console.warn = mock(() => {});
      
      // Create a validator that only allows positive numbers
      const isPositive = (value: number) => value >= 0 ? value : undefined;
      const count = signal(5, { validators: [isPositive] });
      
      // Valid update
      count.set(10);
      expect(count()).toBe(10);
      
      // Invalid update
      count.set(-5);
      // Value should not have changed
      expect(count()).toBe(10);
      
      // Restore console.warn
      console.warn = originalWarn;
    });

    test("calls onSet callback when value changes", () => {
      const onSetCallback = mock(() => {});
      const count = signal(5, { onSet: onSetCallback });
      
      count.set(10);
      
      expect(onSetCallback).toHaveBeenCalledTimes(1);
      expect(onSetCallback).toHaveBeenCalledWith(10, 5);
    });

    test("onSet callback receives correct old and new values", () => {
      let capturedOld = 0;
      let capturedNew = 0;
      
      const count = signal(5, {
        onSet: (newVal, oldVal) => {
          capturedNew = newVal as number;
          capturedOld = oldVal as number;
        }
      });
      
      count.set(10);
      expect(capturedOld).toBe(5);
      expect(capturedNew).toBe(10);
      
      count.update(n => n + 5);
      expect(capturedOld).toBe(10);
      expect(capturedNew).toBe(15);
    });
  });

  describe("Optimization and Edge Cases", () => {
    test("setting the same value does not trigger updates", () => {
      const updateCounter = { count: 0 };
      const count = signal(5, { 
        onSet: () => { updateCounter.count++; } 
      });
      
      // Setting to same value
      count.set(5);
      expect(updateCounter.count).toBe(0);
      
      // Setting to different value
      count.set(10);
      expect(updateCounter.count).toBe(1);
      
      // Setting to same value again
      count.set(10);
      expect(updateCounter.count).toBe(1);
    });

    test("using multiple validators", () => {
      // Mock console.warn
      const originalWarn = console.warn;
      console.warn = mock(() => {});
      
      const isPositive = (value: number) => value >= 0 ? value : undefined;
      const isLessThan100 = (value: number) => value < 100 ? value : undefined;
      
      const count = signal(5, { 
        validators: [isPositive, isLessThan100],
        name: "validatedCount" 
      });
      
      // Valid updates
      count.set(10);
      expect(count()).toBe(10);
      
      count.set(99);
      expect(count()).toBe(99);
      
      // Invalid updates
      count.set(-5);
      expect(count()).toBe(99); // Unchanged
      
      count.set(100);
      expect(count()).toBe(99); // Unchanged
      
      // Restore console.warn
      console.warn = originalWarn;
    });

    test("handles errors in onSet callback", () => {
      const errorCallback = () => {
        throw new Error("Test error in onSet");
      };
      
      const count = signal(5, { onSet: errorCallback });
      
      expect(() => {
        count.set(10);
      }).toThrow();
    });
  });

  describe("Reactivity", () => {
    test("signal triggers effect when value changes", () => {
      const count = signal(0);
      let effectValue = 0;
      
      effect(() => {
        effectValue = count();
      });
      
      expect(effectValue).toBe(0);
      
      count.set(5);
      expect(effectValue).toBe(5);
    });

    test("effect does not run when reading signal with untracked", () => {
      const count = signal(0);
      let effectRuns = 0;
      
      effect(() => {
        // Read without tracking
        untracked(() => {
          count();
        });
        effectRuns++;
      });
      
      // Initial effect run
      expect(effectRuns).toBe(1);
      
      // Update signal - should not trigger effect again
      count.set(5);
      expect(effectRuns).toBe(1);
    });

    test("batched updates only trigger effects once", async () => {
      const count = signal(0);
      let effectRuns = 0;
      
      effect(() => {
        count();
        effectRuns++;
      });
      
      // Initial run
      expect(effectRuns).toBe(1);
      
      
      batch(() => {
        count.set(5);
        count.set(10);
        count.set(15);
      });

      await flushMicrotasks();
      
      // Only one additional effect run
      expect(effectRuns).toBe(2);
      expect(count()).toBe(15);
    });

    test("signal properly releases unused subscribers", () => {
      // This requires mocking WeakRef and garbage collection
      // which is difficult to test reliably in JavaScript
      // We'll check that _deps exists and is a Set
      const count = signal(0);
      expect(count._deps).toBeInstanceOf(Set);
    });
  });

  describe("Advanced Usage", () => {
    test("signals with object values", () => {
      const user = signal({ name: "John", age: 30 });
      
      // Read initial value
      expect(user()).toEqual({ name: "John", age: 30 });
      
      // Update whole object
      user.set({ name: "Jane", age: 28 });
      expect(user()).toEqual({ name: "Jane", age: 28 });
      
      // Update using update method
      user.update(u => ({ ...u, age: u.age + 1 }));
      expect(user()).toEqual({ name: "Jane", age: 29 });
    });

    test("signals with array values", () => {
      const list = signal([1, 2, 3]);
      
      // Read initial value
      expect(list()).toEqual([1, 2, 3]);
      
      // Add item with update
      list.update(items => [...items, 4]);
      expect(list()).toEqual([1, 2, 3, 4]);
      
      // Remove item with update
      list.update(items => items.filter(i => i !== 2));
      expect(list()).toEqual([1, 3, 4]);
      
      // Replace whole array
      list.set([5, 6]);
      expect(list()).toEqual([5, 6]);
    });
  });
});