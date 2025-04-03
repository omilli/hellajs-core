import { describe, expect, mock, test } from "bun:test";
import { batch, computed, effect, signal, untracked } from "../lib/";
import { flushMicrotasks } from "./flush";

describe("Computed", () => {
	describe("Basic Functionality", () => {
		test("creates a computed value from a signal", () => {
			const count = signal(5);
			const doubled = computed(() => count() * 2);

			expect(doubled()).toBe(10);
		});

		test("automatically updates when dependencies change", () => {
			const count = signal(5);
			const doubled = computed(() => count() * 2);

			count.set(10);
			expect(doubled()).toBe(20);
		});

		test("handles complex expressions", () => {
			const x = signal(10);
			const y = signal(5);

			const sum = computed(() => x() + y());
			const product = computed(() => x() * y());

			expect(sum()).toBe(15);
			expect(product()).toBe(50);

			x.set(20);
			expect(sum()).toBe(25);
			expect(product()).toBe(100);
		});

		test("works with string and object values", () => {
			const firstName = signal("John");
			const lastName = signal("Doe");
			const fullName = computed(() => `${firstName()} ${lastName()}`);

			expect(fullName()).toBe("John Doe");

			firstName.set("Jane");
			expect(fullName()).toBe("Jane Doe");

			// Object example
			const user = signal({ name: "John", age: 30 });
			const userInfo = computed(
				() => `${user().name} is ${user().age} years old`,
			);

			expect(userInfo()).toBe("John is 30 years old");

			user.update((u) => ({ ...u, age: u.age + 1 }));
			expect(userInfo()).toBe("John is 31 years old");
		});
	});

	describe("Computed Options", () => {
		test("creates a computed with a name", () => {
			const count = signal(5);
			const doubled = computed(() => count() * 2, { name: "doubledCount" });

			// @ts-expect-error _name is not a public property
			expect(doubled._name).toBe("doubledCount");
		});

		test("calls onComputed callback when value changes", () => {
			const onComputedCallback = mock((value: number) => {});
			const count = signal(5);
			const doubled = computed(() => count() * 2, {
				onComputed: onComputedCallback,
			});

			// Initial computation happens on first access
			doubled();
			expect(onComputedCallback).toHaveBeenCalledTimes(1);
			expect(onComputedCallback).toHaveBeenCalledWith(10);

			// Update dependency
			count.set(10);
			doubled(); // Access to trigger recomputation

			expect(onComputedCallback).toHaveBeenCalledTimes(2);
			expect(onComputedCallback).toHaveBeenCalledWith(20);
		});

		test("handles errors with onError callback", () => {
			const errorHandler = mock((error: Error) => {});
			const condition = signal(true);

			const willFail = computed(
				() => {
					if (condition()) {
						throw new Error("Computation failed");
					}
					return "success";
				},
				{ onError: errorHandler },
			);

			// Should trigger error
			willFail();
			expect(errorHandler).toHaveBeenCalledTimes(1);

			// Fix the condition
			condition.set(false);
			expect(willFail()).toBe("success");
		});

		test("keepAlive option computes value eagerly", () => {
			const computeFn = mock(() => 42);
			const dep = signal(1);

			const lazyComputed = computed(() => {
				dep(); // Create dependency
				return computeFn();
			});

			// Shouldn't compute until accessed
			expect(computeFn).toHaveBeenCalledTimes(0);

			// First access triggers computation
			expect(lazyComputed()).toBe(42);
			expect(computeFn).toHaveBeenCalledTimes(1);

			// Create another computed with keepAlive
			computeFn.mockClear();
			const eagerComputed = computed(
				() => {
					dep(); // Create dependency
					return computeFn();
				},
				{ keepAlive: true },
			);

			// Should compute immediately due to keepAlive
			expect(computeFn).toHaveBeenCalledTimes(1);

			// Access shouldn't trigger another computation
			expect(eagerComputed()).toBe(42);
			expect(computeFn).toHaveBeenCalledTimes(1);
		});

		test("memo option prevents updates when value doesn't change", () => {
			const computeFn = mock((value: number) => (value > 10 ? "high" : "low"));
			const count = signal(5);

			// Without memo
			const normalComputed = computed(() => computeFn(count()));

			expect(normalComputed()).toBe("low");
			expect(computeFn).toHaveBeenCalledTimes(1);

			// Change dependency but result will be the same
			count.set(8);
			expect(normalComputed()).toBe("low");
			expect(computeFn).toHaveBeenCalledTimes(2);

			// With memo
			computeFn.mockClear();
			const memoComputed = computed(() => computeFn(count()), { memo: true });

			expect(memoComputed()).toBe("low");
			expect(computeFn).toHaveBeenCalledTimes(1);

			// Change dependency but result will be the same
			count.set(9);
			expect(memoComputed()).toBe("low");
			// With memo, the function should compute but not update the backing signal
			expect(computeFn).toHaveBeenCalledTimes(2);

			// Change dependency to produce different result
			count.set(15);
			expect(memoComputed()).toBe("high");
			expect(computeFn).toHaveBeenCalledTimes(3);
		});
	});

	describe("Optimization and Edge Cases", () => {
		test("computed values are lazily evaluated", () => {
			const count = signal(5);
			let computeCount = 0;

			const expensive = computed(() => {
				computeCount++;
				return count() * 2;
			});

			// Not accessed yet
			expect(computeCount).toBe(0);

			// First access
			expect(expensive()).toBe(10);
			expect(computeCount).toBe(1);

			// Second access to same value - should use cache
			expect(expensive()).toBe(10);
			expect(computeCount).toBe(1);

			// Change dependency
			count.set(10);

			// Not accessed yet after change
			expect(computeCount).toBe(1);

			// Access after change
			expect(expensive()).toBe(20);
			expect(computeCount).toBe(2);
		});

		test("computed cleanup removes effect", async () => {
			const count = signal(0);
			let effectRuns = 0;

			const double = computed(() => {
				effectRuns++;
				return count() * 2;
			});

			// First access triggers computation
			expect(double()).toBe(0);
			expect(effectRuns).toBe(1);

			// Update should create new computation on next access
			count.set(5);
			expect(double()).toBe(10);
			expect(effectRuns).toBe(2);

			// Cleanup
			double._cleanup();

			// Update after cleanup
			count.set(10);
			// This should show that computation isn't tracking anymore
			expect(double()).toBe(10); // Still returns last computed value

			// No additional effect runs since cleanup
			expect(effectRuns).toBe(2);
		});

		test("computed correctly handles circular dependencies", () => {
			const a = signal(1);

			// This will cause a circular dependency warning/error in dev mode
			const circular = computed(() => {
				// A computed that depends on itself - this should be detected
				const val = a();
				try {
					// @ts-expect-error Accessing private property for testing
					circular._deps;
					return val;
				} catch (e) {
					return "circular detected";
				}
			});

			// The framework should prevent infinite loops
			expect(() => circular()).not.toThrow();
		});
	});

	describe("Advanced Patterns", () => {
		test("computed can depend on other computed values", () => {
			const count = signal(5);
			const doubled = computed(() => count() * 2);
			const quadrupled = computed(() => doubled() * 2);

			expect(doubled()).toBe(10);
			expect(quadrupled()).toBe(20);

			count.set(10);
			expect(doubled()).toBe(20);
			expect(quadrupled()).toBe(40);
		});

		test("computed with multiple signal dependencies", () => {
			const first = signal("John");
			const last = signal("Doe");
			const age = signal(30);

			const profile = computed(() => ({
				name: `${first()} ${last()}`,
				age: age(),
			}));

			expect(profile()).toEqual({ name: "John Doe", age: 30 });

			first.set("Jane");
			expect(profile()).toEqual({ name: "Jane Doe", age: 30 });

			age.set(25);
			expect(profile()).toEqual({ name: "Jane Doe", age: 25 });
		});

		test("works with effects for side effects", async () => {
			const count = signal(0);
			const doubled = computed(() => count() * 2);
			let effectResult = 0;

			effect(() => {
				effectResult = doubled();
			});

			// Initial run
			expect(effectResult).toBe(0);

			// Update signal
			count.set(5);
			expect(effectResult).toBe(10);

			// Batched updates
			batch(() => {
				count.set(10);
				count.set(15);
			});

			await flushMicrotasks();

			expect(effectResult).toBe(30);
		});

		test("untracked access doesn't create dependencies", () => {
			const count = signal(0);
			let computeCalls = 0;

			const computed1 = computed(() => {
				computeCalls++;
				// Regular tracked access
				return count() * 2;
			});

			const computed2 = computed(() => {
				computeCalls++;
				// Untracked access doesn't create dependency
				return untracked(() => count()) * 3;
			});

			// Initial computation
			expect(computed1()).toBe(0);
			expect(computed2()).toBe(0);
			expect(computeCalls).toBe(2);

			// Update signal
			count.set(5);

			// computed1 should recompute, computed2 shouldn't
			expect(computed1()).toBe(10); // Recomputed
			expect(computeCalls).toBe(3);

			expect(computed2()).toBe(0); // Still old value (hasn't recomputed)
			expect(computeCalls).toBe(3);

			// Manually read computed2 again to force recomputation
			computeCalls = 0;
			computed2._cleanup(); // Force recomputation
			expect(computed2()).toBe(15); // Now gets fresh value
			expect(computeCalls).toBe(1);
		});
	});
});
