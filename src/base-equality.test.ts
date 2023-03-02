import { isEqual as checkEquality } from "./base-equality";

describe("checkEquality", () => {
	test("returns true for identical objects", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 2 };
		expect(checkEquality(a, b)).toBe(true);
	});

	test("returns true for arrays with the same contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 3];
		expect(checkEquality(a, b)).toBe(true);
	});

	test("returns false for objects with different values", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 3 };
		expect(checkEquality(a, b)).toBe(false);
	});

	test("returns false for objects with different properties", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, z: 2 };
		expect(checkEquality(a, b)).toBe(false);
	});

	test("returns false for arrays with different contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 4];
		expect(checkEquality(a, b)).toBe(false);
	});

	test("returns false for arrays with different lengths", () => {
		const a = [1, 2, 3];
		const b = [1, 2];
		expect(checkEquality(a, b)).toBe(false);
	});

	test("returns true for mixed objects and arrays", () => {
		const a = { x: 1, y: [2, 3] };
		const b = { x: 1, y: [2, 3] };
		expect(checkEquality(a, b)).toBe(true);
	});

	test("returns true for null values", () => {
		expect(checkEquality(null, null)).toBe(true);
	});

	test("returns false for null and undefined values", () => {
		expect(checkEquality(null, undefined)).toBe(false);
	});
});
