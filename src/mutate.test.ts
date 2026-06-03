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
