import { mutate as safelyMutate } from "./mutate";

describe("safelyMutate", () => {
	test("should safely mutate an object", () => {
		const obj = { name: "John", age: 25 };
		const newObj = safelyMutate(obj, (draft) => {
			draft.name = "Jane";
			draft.age += 5;
		});
		expect(newObj).toEqual({ name: "Jane", age: 30 });
		expect(obj).toEqual({ name: "John", age: 25 });
	});

	test("should safely mutate an array", () => {
		const arr = [1, 2, 3];
		const newArr = safelyMutate(arr, (draft) => {
			draft.push(4);
			draft[0] = 0;
		});
		expect(newArr).toEqual([0, 2, 3, 4]);
		expect(arr).toEqual([1, 2, 3]);
	});

	test("should safely mutate a string", () => {
		const str = "hello";
		const newStr = safelyMutate(str, (_) => {
			_ = "world";
		});
		expect(newStr).toBe("world");
		expect(str).toBe("hello");
	});

	test("should not mutate the original value", () => {
		const obj = { name: "John", age: 25 };
		safelyMutate(obj, (draft) => {
			draft.name = "Jane";
			draft.age += 5;
		});
		expect(obj).toEqual({ name: "John", age: 25 });

		const arr = [1, 2, 3];
		safelyMutate(arr, (draft) => {
			draft.push(4);
			draft[0] = 0;
		});
		expect(arr).toEqual([1, 2, 3]);

		const str = "hello";
		safelyMutate(str, (draft) => {
			draft = "world";
		});
		expect(str).toBe("hello");
	});
});
