type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type MutableDraft<T> = T extends Primitive
	? T
	: T extends (...args: Array<never>) => unknown
		? T
		: T extends Date
			? T
			: T extends ReadonlyMap<infer Key, infer Value>
				? Map<MutableDraft<Key>, MutableDraft<Value>>
				: T extends ReadonlySet<infer Value>
					? Set<MutableDraft<Value>>
					: T extends ReadonlyArray<infer Value>
						? Array<MutableDraft<Value>>
						: T extends object
							? { -readonly [Key in keyof T]: MutableDraft<T[Key]> }
							: T;
export type DraftUpdater<T> = (draft: MutableDraft<T>) => void | T;
export type Mutator<T> = DraftUpdater<T>;
export type CloneValue<T = unknown> = (value: T) => T;
type StructuredClone = <T>(value: T) => T;

const runtimeStructuredClone = (
	globalThis as typeof globalThis & { structuredClone?: StructuredClone }
).structuredClone;

export interface MutateOptions<T> {
	clone?: CloneValue<T>;
}

export function mutate<T>(
	value: T,
	updater: DraftUpdater<T>,
	options: MutateOptions<T> = {},
): T {
	const draft = (options.clone ?? cloneValue)(value) as MutableDraft<T>;
	const result = updater(draft);

	return result === undefined ? (draft as T) : result;
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
