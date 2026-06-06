export type Mutator<T> = (draft: T) => void | T;
export type CloneValue<T = unknown> = (value: T) => T;
type StructuredClone = <T>(value: T) => T;

const runtimeStructuredClone = (
	globalThis as typeof globalThis & { structuredClone?: StructuredClone }
).structuredClone;

export interface MutateOptions<T> {
	clone?: CloneValue<T>;
}

export function mutate<T>(value: T, mutator: Mutator<T>, options: MutateOptions<T> = {}): T {
	const draft = (options.clone ?? cloneValue)(value);
	const result = mutator(draft);

	return result === undefined ? draft : result;
}

export function cloneValue<T>(value: T): T {
	if (typeof value !== "object" || value === null) {
		return value;
	}

	if (typeof runtimeStructuredClone !== "function") {
		throw new TypeError(
			"Default mutation cloning requires structuredClone. Provide a clone option for this runtime.",
		);
	}

	try {
		return runtimeStructuredClone(value);
	} catch (error) {
		throw new TypeError(
			"Default mutation cloning uses structuredClone and cannot clone this value. Provide a clone option for custom state semantics.",
			{ cause: error },
		);
	}
}
