import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AbstractMutableStore } from "./abstract-mutable-store";

function createMockStore<T>(initialValue: T, equalityFn?: (a: T, b: T) => boolean) {
	class MockStore extends AbstractMutableStore<T> {}
	return new MockStore(initialValue, equalityFn);
}

describe("AbstractMutableStore", () => {
	it("returns the initial value", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });

		assert.deepEqual(store.getSnapshot(), { prop1: "value1", prop2: 42 });
	});

	it("notifies listeners when the value changes", () => {
		const calls: Array<{ prop1: string; prop2: number }> = [];
		const store = createMockStore({
			prop1: "value1",
			prop2: 42,
		});

		store.subscribe((value) => calls.push(value));
		store.setValue({ prop1: "newvalue", prop2: 99 });

		assert.deepEqual(calls, [{ prop1: "newvalue", prop2: 99 }]);
	});

	it("does not notify listeners when the value is set to the same value", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });
		const calls: Array<{ prop1: string; prop2: number }> = [];

		store.subscribe((value) => calls.push(value));
		store.setValue({ prop1: "value1", prop2: 42 });

		assert.deepEqual(calls, []);
	});

	it("uses the provided equality function", () => {
		const store = createMockStore(
			{ version: 1, value: "old" },
			(a, b) => a.version === b.version,
		);
		const calls: Array<{ version: number; value: string }> = [];

		store.subscribe((value) => calls.push(value));
		store.setValue({ version: 1, value: "new" });
		store.setValue({ version: 2, value: "newer" });

		assert.deepEqual(calls, [{ version: 2, value: "newer" }]);
		assert.deepEqual(store.getSnapshot(), { version: 2, value: "newer" });
	});

	it("uses the provided equality function from options", () => {
		class TestStore extends AbstractMutableStore<{ version: number; value: string }> {
			constructor() {
				super({ version: 1, value: "old" }, { equality: (a, b) => a.version === b.version });
			}
		}

		const store = new TestStore();
		const calls: Array<{ version: number; value: string }> = [];

		store.subscribe((value) => calls.push(value));
		store.setValue({ version: 1, value: "new" });
		store.setValue({ version: 2, value: "newer" });

		assert.deepEqual(calls, [{ version: 2, value: "newer" }]);
		assert.deepEqual(store.getSnapshot(), { version: 2, value: "newer" });
	});

	it("uses the provided clone function from options", () => {
		const callback = () => "value";

		class TestStore extends AbstractMutableStore<{ name: string; callback: () => string }> {
			constructor() {
				super({ name: "before", callback }, { clone: (value) => ({ ...value }) });
			}
		}

		const store = new TestStore();

		const result = store.mutate((draft) => {
			draft.name = "after";
		});

		assert.deepEqual(result, { name: "after", callback });
		assert.deepEqual(store.getSnapshot(), { name: "after", callback });
	});

	it("does not notify unsubscribed listeners", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });

		const calls: Array<{ prop1: string; prop2: number }> = [];
		const unsubscribedCalls: Array<{ prop1: string; prop2: number }> = [];
		const unsubscribe = store.subscribe((value) => unsubscribedCalls.push(value));
		unsubscribe();

		store.subscribe((value) => calls.push(value));

		store.setValue({ prop1: "newvalue", prop2: 99 });

		assert.deepEqual(unsubscribedCalls, []);
		assert.deepEqual(calls, [{ prop1: "newvalue", prop2: 99 }]);
	});

	it("allows unsubscribe to be called more than once", () => {
		const store = createMockStore({ count: 0 });
		const calls: Array<{ count: number }> = [];

		const unsubscribe = store.subscribe((value) => calls.push(value));
		unsubscribe();
		unsubscribe();

		store.setValue({ count: 1 });

		assert.deepEqual(calls, []);
	});

	it("safely mutates the draft value", () => {
		class TestStore extends AbstractMutableStore<{ count: number }> {}

		const store = new TestStore({ count: 0 });
		const calls: Array<{ count: number }> = [];
		store.subscribe((value) => calls.push(value));

		const result = store.mutate((draft) => {
			draft.count += 1;
		});

		assert.deepEqual(result, { count: 1 });
		assert.deepEqual(store.getSnapshot(), { count: 1 });
		assert.deepEqual(calls, [{ count: 1 }]);
	});

	it("uses replacement values returned by mutators", () => {
		const store = createMockStore({ count: 0 });

		const result = store.mutate(() => ({ count: 10 }));

		assert.deepEqual(result, { count: 10 });
		assert.deepEqual(store.getSnapshot(), { count: 10 });
	});

	it("does not notify when a mutation leaves the value equal", () => {
		const store = createMockStore({ count: 0 });
		const calls: Array<{ count: number }> = [];

		store.subscribe((value) => calls.push(value));
		const result = store.mutate((draft) => {
			draft.count = 0;
		});

		assert.deepEqual(result, { count: 0 });
		assert.deepEqual(calls, []);
	});
});
