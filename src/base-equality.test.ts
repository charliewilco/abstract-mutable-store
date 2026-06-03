import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isEqual as checkEquality } from "./base-equality";

describe("checkEquality", () => {
	it("returns true for identical objects", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 2 };
		assert.equal(checkEquality(a, b), true);
	});

	it("returns true for arrays with the same contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 3];
		assert.equal(checkEquality(a, b), true);
	});

	it("returns false for objects with different values", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 3 };
		assert.equal(checkEquality(a, b), false);
	});

	it("returns false for objects with different properties", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, z: 2 };
		assert.equal(checkEquality(a, b), false);
	});

	it("returns false for arrays with different contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 4];
		assert.equal(checkEquality(a, b), false);
	});

	it("returns false for arrays with different lengths", () => {
		const a = [1, 2, 3];
		const b = [1, 2];
		assert.equal(checkEquality(a, b), false);
	});

	it("returns true for mixed objects and arrays", () => {
		const a = { x: 1, y: [2, 3] };
		const b = { x: 1, y: [2, 3] };
		assert.equal(checkEquality(a, b), true);
	});

	it("returns true for null values", () => {
		assert.equal(checkEquality(null, null), true);
	});

	it("returns false for null and undefined values", () => {
		assert.equal(checkEquality(null, undefined), false);
	});

	it("returns true for matching primitive values", () => {
		assert.equal(checkEquality("value", "value"), true);
		assert.equal(checkEquality(1, 1), true);
		assert.equal(checkEquality(true, true), true);
	});

	it("returns false for mismatched primitive values", () => {
		assert.equal(checkEquality("value", "other"), false);
		assert.equal(checkEquality(1, 2), false);
		assert.equal(checkEquality(true, false), false);
	});

	it("does not treat null as equal to NaN", () => {
		assert.equal(checkEquality(null, NaN), false);
	});

	it("only treats functions as equal when they are the same reference", () => {
		const fn = () => undefined;

		assert.equal(checkEquality(fn, fn), true);
		assert.equal(
			checkEquality(
				() => undefined,
				() => undefined,
			),
			false,
		);
	});
});
