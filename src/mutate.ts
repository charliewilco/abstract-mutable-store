export type Mutator<T> = (draft: T) => void | T;

export function mutate<T>(value: T, mutator: Mutator<T>): T {
	const draft = cloneValue(value);
	const result = mutator(draft);

	return result === undefined ? draft : result;
}

function cloneValue<T>(value: T): T {
	if (typeof value !== "object" || value === null) {
		return value;
	}

	return JSON.parse(JSON.stringify(value));
}
