function checkEquality(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) {
		return true;
	}

	if (typeof a !== typeof b || a === null || b === null) {
		return false;
	}

	const serializedA = JSON.stringify(a);
	const serializedB = JSON.stringify(b);

	if (serializedA === undefined || serializedB === undefined) {
		return false;
	}

	return serializedA === serializedB;
}

export type EqualityCheck<T = unknown> = (a: T, b: T) => boolean;

export const isEqual: EqualityCheck = checkEquality;
