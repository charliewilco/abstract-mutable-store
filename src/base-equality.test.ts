import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isEqual as checkEquality } from "./base-equality";

describe("checkEquality", () => {
	test("returns true for identical objects", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 2 };
		assert.equal(checkEquality(a, b), true);
	});

	test("returns true for arrays with the same contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 3];
		assert.equal(checkEquality(a, b), true);
	});

	test("returns false for objects with different values", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, y: 3 };
		assert.equal(checkEquality(a, b), false);
	});

	test("returns false for objects with different properties", () => {
		const a = { x: 1, y: 2 };
		const b = { x: 1, z: 2 };
		assert.equal(checkEquality(a, b), false);
	});

	test("returns false for arrays with different contents", () => {
		const a = [1, 2, 3];
		const b = [1, 2, 4];
		assert.equal(checkEquality(a, b), false);
	});

	test("returns false for arrays with different lengths", () => {
		const a = [1, 2, 3];
		const b = [1, 2];
		assert.equal(checkEquality(a, b), false);
	});

	test("returns true for mixed objects and arrays", () => {
		const a = { x: 1, y: [2, 3] };
		const b = { x: 1, y: [2, 3] };
		assert.equal(checkEquality(a, b), true);
	});

	test("returns true for Date values with the same timestamp", () => {
		const a = { createdAt: new Date("2026-06-06T12:00:00.000Z") };
		const b = { createdAt: new Date("2026-06-06T12:00:00.000Z") };

		assert.equal(checkEquality(a, b), true);
	});

	test("returns false for Date values with different timestamps", () => {
		const a = { createdAt: new Date("2026-06-06T12:00:00.000Z") };
		const b = { createdAt: new Date("2026-06-06T12:00:01.000Z") };

		assert.equal(checkEquality(a, b), false);
	});

	test("preserves the difference between undefined fields and missing fields", () => {
		assert.equal(checkEquality({ optional: undefined }, { optional: undefined }), true);
		assert.equal(checkEquality({ optional: undefined }, {}), false);
	});

	test("returns true for Map and Set values with matching contents", () => {
		const a = {
			ids: new Set([1, 2]),
			labels: new Map([
				["one", "first"],
				["two", "second"],
			]),
		};
		const b = {
			ids: new Set([2, 1]),
			labels: new Map([
				["two", "second"],
				["one", "first"],
			]),
		};

		assert.equal(checkEquality(a, b), true);
	});

	test("returns true for equivalent circular references", () => {
		interface CircularState {
			name: string;
			self?: CircularState;
		}

		const a: CircularState = { name: "same" };
		const b: CircularState = { name: "same" };
		a.self = a;
		b.self = b;

		assert.equal(checkEquality(a, b), true);
	});

	test("returns false for different circular references", () => {
		interface CircularState {
			name: string;
			self?: CircularState;
		}

		const a: CircularState = { name: "same" };
		const b: CircularState = { name: "same" };
		a.self = a;
		b.self = { name: "different" };

		assert.equal(checkEquality(a, b), false);
	});

	test("returns true for null values", () => {
		assert.equal(checkEquality(null, null), true);
	});

	test("returns false for null and undefined values", () => {
		assert.equal(checkEquality(null, undefined), false);
	});

	test("returns true for matching primitive values", () => {
		assert.equal(checkEquality("value", "value"), true);
		assert.equal(checkEquality(1, 1), true);
		assert.equal(checkEquality(true, true), true);
	});

	test("returns false for mismatched primitive values", () => {
		assert.equal(checkEquality("value", "other"), false);
		assert.equal(checkEquality(1, 2), false);
		assert.equal(checkEquality(true, false), false);
	});

	test("does not treat null as equal to NaN", () => {
		assert.equal(checkEquality(null, NaN), false);
	});

	test("only treats functions as equal when they are the same reference", () => {
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
