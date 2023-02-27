import { AbstractStore } from "../src";

describe("AbstractStore", () => {
	/**
	 * A mock listener function that can be used in tests.
	 */
	const mockListener = jest.fn();

	/**
	 * A mock value object that can be used in tests.
	 */
	const mockValue = { prop1: "value1", prop2: 42 };

	/**
	 * Creates a new instance of `AbstractStore` with the specified initial value.
	 *
	 * @param initialValue The initial value of the store.
	 * @returns A new instance of `AbstractStore`.
	 */
	function createMockStore(initialValue: typeof mockValue) {
		class MockStore extends AbstractStore<typeof mockValue> {}
		return new MockStore(initialValue);
	}

	test("should return the initial value", () => {
		const store = createMockStore(mockValue);

		expect(store.getSnapshot()).toEqual(mockValue);
	});

	test("should notify listeners when the value changes", () => {
		const store = createMockStore(mockValue);

		store.subscribe(mockListener);
		store.setValue({ prop1: "newvalue", prop2: 99 });

		expect(mockListener).toHaveBeenCalledTimes(1);
		expect(mockListener).toHaveBeenCalledWith({ prop1: "newvalue", prop2: 99 });
	});

	test("should not notify listeners when the value is set to the same value", () => {
		const store = createMockStore(mockValue);

		const listener = jest.fn();

		store.subscribe(listener);
		store.setValue(mockValue);

		expect(listener).not.toHaveBeenCalled();
	});

	test("should not notify unsubscribed listeners", () => {
		const store = createMockStore(mockValue);

		let listener = jest.fn();
		let listener2 = jest.fn();
		const unsubscribe = store.subscribe(listener);
		unsubscribe();

		store.subscribe(listener2);

		store.setValue({ prop1: "newvalue", prop2: 99 });

		expect(listener).not.toHaveBeenCalled();
		expect(listener2).toHaveBeenCalledTimes(1);
	});

	test("should safely mutate the draft value", () => {
		class TestStore extends AbstractStore<{ count: number }> {}

		const store = new TestStore({ count: 0 });

		const result = store.mutate((draft) => {
			draft.count += 1;
		});

		expect(result).toEqual({ count: 1 });
		expect(store.getSnapshot()).toEqual({ count: 1 });
	});
});
