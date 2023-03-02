export function mutate<T>(value: T, mutator: (draft: T) => void | T): T {
	if (typeof value === "string") {
		return mutator(value) as T;
	} else {
		let draft = JSON.parse(JSON.stringify(value));
		mutator(draft);
		return draft;
	}
}
