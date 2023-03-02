import { isEqual, type EqualityCheck } from "./base-equality";
import { mutate } from "./mutate";
/**
 * An abstract class for creating a store that is compliant with `useSyncExternalStore`.
 */
export abstract class AbstractMutableStore<T> {
	private listeners: Set<(value: T) => void> = new Set();

	/**
	 * Creates a new instance of `AbstractStore`.
	 *
	 * @param initialValue The initial value of the store.
	 */
	constructor(protected value: T, private equalityFn: EqualityCheck = isEqual) {}

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
	 * Applies the given mutation function to a draft of the current value, and returns an immutable
	 * copy of the updated value.
	 *
	 * @param mutationFn - A callback function that takes a draft of the current value, and mutates it
	 *                     as needed.
	 * @returns An immutable copy of the updated value.
	 */
	public mutate(mutator: (draft: T) => void): T {
		let draft = mutate(this.value, mutator);
		this.value = draft;
		let immutableValue = JSON.parse(JSON.stringify(this.value));

		this.notifyValueChanged(immutableValue);

		return immutableValue;
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
