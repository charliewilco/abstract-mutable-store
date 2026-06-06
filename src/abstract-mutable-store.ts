import { isEqual, type EqualityCheck } from "./base-equality";
import { cloneValue, mutate, type CloneValue, type Mutator } from "./mutate";

export interface AbstractMutableStoreOptions<T> {
	equality?: EqualityCheck<T>;
	clone?: CloneValue<T>;
}

/**
 * An abstract class for creating a store that is compliant with `useSyncExternalStore`.
 */
export abstract class AbstractMutableStore<T> {
	private listeners: Set<(value: T) => void> = new Set();
	private equalityFn: EqualityCheck<T>;
	private cloneFn: CloneValue<T>;

	/**
	 * Creates a new instance of `AbstractStore`.
	 *
	 * @param initialValue The initial value of the store.
	 */
	constructor(
		protected value: T,
		options: EqualityCheck<T> | AbstractMutableStoreOptions<T> = isEqual,
	) {
		if (typeof options === "function") {
			this.equalityFn = options;
			this.cloneFn = cloneValue;
		} else {
			this.equalityFn = options.equality ?? isEqual;
			this.cloneFn = options.clone ?? cloneValue;
		}
	}

	/**
	 * Returns a snapshot of the current value of the store.
	 *
	 * @returns A snapshot of the current value of the store.
	 */
	public getSnapshot(): T {
		return this.value;
	}

	/**
	 * Updates the value of the store and notifies all listeners of the change.
	 *
	 * @param newValue The new value of the store.
	 */
	public setValue(newValue: T): void {
		if (this.equalityFn(this.value, newValue)) {
			return;
		}

		this.value = newValue;
		this.notifyValueChanged(newValue);
	}

	/**
	 * Applies the given mutation function to a draft of the current value.
	 *
	 * @param mutationFn - A callback function that takes a draft of the current value, and mutates it
	 *                     as needed.
	 * @returns The updated value.
	 */
	public mutate(mutator: Mutator<T>): T {
		const newValue = mutate(this.value, mutator, { clone: this.cloneFn });

		if (this.equalityFn(this.value, newValue)) {
			return this.value;
		}

		this.value = newValue;
		this.notifyValueChanged(newValue);

		return newValue;
	}
	/**
	 * Subscribes a listener function to changes in the store and returns an unsubscribe function.
	 *
	 * @param listener The listener function to subscribe to changes in the store.
	 * @returns An unsubscribe function that can be called to remove the listener.
	 */
	public subscribe(listener: (value: T) => void): () => void {
		this.listeners.add(listener);

		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * Notifies all listeners of a change in the value of the store.
	 *
	 * @param newValue The new value of the store.
	 */
	private notifyValueChanged(newValue: T): void {
		for (const listener of this.listeners) {
			listener(newValue);
		}
	}
}
