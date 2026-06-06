export type EqualityCheck<T = unknown> = (a: T, b: T) => boolean;

type SeenPairs = Array<readonly [object, object]>;

function checkEquality(a: unknown, b: unknown): boolean {
	return areEqual(a, b, []);
}

function areEqual(a: unknown, b: unknown, seen: SeenPairs): boolean {
	if (Object.is(a, b)) {
		return true;
	}

	if (typeof a !== typeof b || !isObject(a) || !isObject(b)) {
		return false;
	}

	if (typeof a === "function" || typeof b === "function") {
		return false;
	}

	if (hasSeenPair(a, b, seen)) {
		return true;
	}

	if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
		return false;
	}

	if (a instanceof Date && b instanceof Date) {
		return Object.is(a.getTime(), b.getTime());
	}

	if (a instanceof RegExp && b instanceof RegExp) {
		return a.source === b.source && a.flags === b.flags && a.lastIndex === b.lastIndex;
	}

	if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
		return a instanceof ArrayBuffer && b instanceof ArrayBuffer && areArrayBuffersEqual(a, b);
	}

	if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
		return ArrayBuffer.isView(a) && ArrayBuffer.isView(b) && areArrayBufferViewsEqual(a, b);
	}

	if (a instanceof Map && b instanceof Map) {
		return areMapsEqual(a, b, seen);
	}

	if (a instanceof Set && b instanceof Set) {
		return areSetsEqual(a, b, seen);
	}

	if (a instanceof WeakMap || a instanceof WeakSet || a instanceof Promise) {
		return false;
	}

	return areObjectsEqual(a, b, seen);
}

function isObject(value: unknown): value is object {
	return (typeof value === "object" || typeof value === "function") && value !== null;
}

function hasSeenPair(a: object, b: object, seen: SeenPairs): boolean {
	if (seen.some(([seenA, seenB]) => seenA === a && seenB === b)) {
		return true;
	}

	seen.push([a, b]);

	return false;
}

function areMapsEqual(
	a: Map<unknown, unknown>,
	b: Map<unknown, unknown>,
	seen: SeenPairs,
): boolean {
	if (a.size !== b.size) {
		return false;
	}

	const bEntries = Array.from(b);
	const matchedIndexes = new Set<number>();

	for (const [aKey, aValue] of a) {
		let matchedIndex = -1;

		for (const [index, [bKey, bValue]] of bEntries.entries()) {
			const candidateSeen = [...seen];

			if (
				!matchedIndexes.has(index) &&
				areEqual(aKey, bKey, candidateSeen) &&
				areEqual(aValue, bValue, candidateSeen)
			) {
				matchedIndex = index;
				seen.splice(0, seen.length, ...candidateSeen);
				break;
			}
		}

		if (matchedIndex === -1) {
			return false;
		}

		matchedIndexes.add(matchedIndex);
	}

	return true;
}

function areSetsEqual(a: Set<unknown>, b: Set<unknown>, seen: SeenPairs): boolean {
	if (a.size !== b.size) {
		return false;
	}

	const bValues = Array.from(b);
	const matchedIndexes = new Set<number>();

	for (const aValue of a) {
		let matchedIndex = -1;

		for (const [index, bValue] of bValues.entries()) {
			const candidateSeen = [...seen];

			if (!matchedIndexes.has(index) && areEqual(aValue, bValue, candidateSeen)) {
				matchedIndex = index;
				seen.splice(0, seen.length, ...candidateSeen);
				break;
			}
		}

		if (matchedIndex === -1) {
			return false;
		}

		matchedIndexes.add(matchedIndex);
	}

	return true;
}

function areArrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
	return areByteArraysEqual(new Uint8Array(a), new Uint8Array(b));
}

function areArrayBufferViewsEqual(a: ArrayBufferView, b: ArrayBufferView): boolean {
	return (
		Object.getPrototypeOf(a) === Object.getPrototypeOf(b) &&
		areByteArraysEqual(
			new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
			new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
		)
	);
}

function areByteArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}

	return a.every((value, index) => value === b[index]);
}

function areObjectsEqual(a: object, b: object, seen: SeenPairs): boolean {
	const aKeys = enumerableOwnKeys(a);
	const bKeys = enumerableOwnKeys(b);

	if (aKeys.length !== bKeys.length) {
		return false;
	}

	for (const key of aKeys) {
		if (!Object.prototype.propertyIsEnumerable.call(b, key)) {
			return false;
		}

		if (!areEqual(getProperty(a, key), getProperty(b, key), seen)) {
			return false;
		}
	}

	return true;
}

function enumerableOwnKeys(value: object): Array<string | symbol> {
	return Reflect.ownKeys(value).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(value, key),
	);
}

function getProperty(value: object, key: string | symbol): unknown {
	return (value as Record<string | symbol, unknown>)[key];
}

export const isEqual: EqualityCheck = checkEquality;
