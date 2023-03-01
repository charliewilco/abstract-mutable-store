import { AbstractMutableStore } from "./abstract-mutable-store";

function createMockStore<T>(initialValue: T) {
	class MockStore extends AbstractMutableStore<T> {}
	return new MockStore(initialValue);
}

describe("AbstractStore", () => {
	test("should return the initial value", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });

		expect(store.getSnapshot()).toEqual({ prop1: "value1", prop2: 42 });
	});

	test("should notify listeners when the value changes", () => {
		const mockListener = jest.fn();
		const store = createMockStore({
			prop1: "value1",
			prop2: 42,
		});

		store.subscribe(mockListener);
		store.setValue({ prop1: "newvalue", prop2: 99 });

		expect(mockListener).toHaveBeenCalledTimes(1);
		expect(mockListener).toHaveBeenCalledWith({ prop1: "newvalue", prop2: 99 });
	});

	test("should not notify listeners when the value is set to the same value", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });

		const listener = jest.fn();

		store.subscribe(listener);
		store.setValue({ prop1: "value1", prop2: 42 });

		expect(listener).not.toHaveBeenCalled();
	});

	test("should not notify unsubscribed listeners", () => {
		const store = createMockStore({ prop1: "value1", prop2: 42 });

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
		class TestStore extends AbstractMutableStore<{ count: number }> {}

		const store = new TestStore({ count: 0 });

		const result = store.mutate((draft) => {
			draft.count += 1;
		});

		expect(result).toEqual({ count: 1 });
		expect(store.getSnapshot()).toEqual({ count: 1 });
	});
});
