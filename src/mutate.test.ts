import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mutate as safelyMutate } from "./mutate";

describe("safelyMutate", () => {
	it("safely mutates an object", () => {
		const obj = { name: "John", age: 25 };
		const newObj = safelyMutate(obj, (draft) => {
			draft.name = "Jane";
			draft.age += 5;
		});
		assert.deepEqual(newObj, { name: "Jane", age: 30 });
		assert.deepEqual(obj, { name: "John", age: 25 });
	});

	it("safely mutates an array", () => {
		const arr = [1, 2, 3];
		const newArr = safelyMutate(arr, (draft) => {
			draft.push(4);
			draft[0] = 0;
		});
		assert.deepEqual(newArr, [0, 2, 3, 4]);
		assert.deepEqual(arr, [1, 2, 3]);
	});

	it("clones Date values without converting them to strings", () => {
		const obj = { createdAt: new Date("2026-06-06T12:00:00.000Z"), name: "draft" };
		const newObj = safelyMutate(obj, (draft) => {
			draft.createdAt.setUTCFullYear(2027);
			draft.name = "published";
		});

		assert.equal(newObj.createdAt instanceof Date, true);
		assert.equal(newObj.createdAt.toISOString(), "2027-06-06T12:00:00.000Z");
		assert.equal(obj.createdAt.toISOString(), "2026-06-06T12:00:00.000Z");
		assert.deepEqual(obj, { createdAt: new Date("2026-06-06T12:00:00.000Z"), name: "draft" });
	});

	it("preserves undefined fields when cloning objects", () => {
		const obj: { name: string; optional: string | undefined } = {
			name: "before",
			optional: undefined,
		};

		const newObj = safelyMutate(obj, (draft) => {
			draft.name = "after";
		});

		assert.equal(Object.hasOwn(newObj, "optional"), true);
		assert.equal(newObj.optional, undefined);
		assert.equal(Object.hasOwn(obj, "optional"), true);
		assert.deepEqual(obj, { name: "before", optional: undefined });
	});

	it("clones Map and Set values", () => {
		const obj = {
			ids: new Set([1, 2]),
			labels: new Map([
				["one", "first"],
				["two", "second"],
			]),
		};

		const newObj = safelyMutate(obj, (draft) => {
			draft.ids.add(3);
			draft.labels.set("three", "third");
		});

		assert.deepEqual(Array.from(newObj.ids), [1, 2, 3]);
		assert.deepEqual(Array.from(newObj.labels), [
			["one", "first"],
			["two", "second"],
			["three", "third"],
		]);
		assert.deepEqual(Array.from(obj.ids), [1, 2]);
		assert.deepEqual(Array.from(obj.labels), [
			["one", "first"],
			["two", "second"],
		]);
	});

	it("preserves circular references when cloning objects", () => {
		interface CircularState {
			name: string;
			self?: CircularState;
		}

		const obj: CircularState = { name: "before" };
		obj.self = obj;

		const newObj = safelyMutate(obj, (draft) => {
			draft.name = "after";
		});

		assert.notEqual(newObj, obj);
		assert.equal(newObj.self, newObj);
		assert.equal(obj.self, obj);
		assert.equal(obj.name, "before");
		assert.equal(newObj.name, "after");
	});

	it("throws for function values with the default clone behavior", () => {
		const obj = { name: "before", callback: () => "value" };

		assert.throws(
			() =>
				safelyMutate(obj, (draft) => {
					draft.name = "after";
				}),
			/structuredClone/,
		);
	});

	it("uses a custom clone function for state that structuredClone cannot clone", () => {
		const obj = { name: "before", callback: () => "value" };
		const newObj = safelyMutate(
			obj,
			(draft) => {
				draft.name = "after";
			},
			{ clone: (value) => ({ ...value }) },
		);

		assert.equal(newObj.name, "after");
		assert.equal(newObj.callback, obj.callback);
		assert.deepEqual(obj, { name: "before", callback: obj.callback });
	});

	it("uses returned string values", () => {
		const str = "hello";
		const newStr = safelyMutate(str, () => {
			return "world";
		});
		assert.equal(newStr, "world");
		assert.equal(str, "hello");
	});

	it("uses returned number values", () => {
		const value = 1;
		const newValue = safelyMutate(value, () => 2);

		assert.equal(newValue, 2);
		assert.equal(value, 1);
	});

	it("uses replacement values returned for objects", () => {
		const obj = { name: "John", age: 25 };
		const newObj = safelyMutate(obj, () => ({ name: "Jane", age: 30 }));

		assert.deepEqual(newObj, { name: "Jane", age: 30 });
		assert.deepEqual(obj, { name: "John", age: 25 });
	});

	it("does not mutate the original value", () => {
		const obj = { name: "John", age: 25 };
		safelyMutate(obj, (draft) => {
			draft.name = "Jane";
			draft.age += 5;
		});
		assert.deepEqual(obj, { name: "John", age: 25 });

		const arr = [1, 2, 3];
		safelyMutate(arr, (draft) => {
			draft.push(4);
			draft[0] = 0;
		});
		assert.deepEqual(arr, [1, 2, 3]);

		const str = "hello";
		safelyMutate(str, () => "world");
		assert.equal(str, "hello");
	});

	it("returns the original primitive value when no replacement is returned", () => {
		const value = 1;
		const newValue = safelyMutate(value, () => {});

		assert.equal(newValue, 1);
	});
});
