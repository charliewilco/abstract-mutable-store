export function mutate<T>(value: T, mutator: (draft: T) => void): T {
	if (typeof value === "string") {
		let draft = value;
		mutator(draft);
		return draft;
	} else {
		let draft = JSON.parse(JSON.stringify(value));
		mutator(draft);
		return draft;
	}
}
