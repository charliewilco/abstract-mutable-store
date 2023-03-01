<h1 align="center">Abstract Mutable Store</h1>

[![Unit Tests](https://github.com/charliewilco/esm-ts-defaults/actions/workflows/node.yml/badge.svg)](https://github.com/charliewilco/esm-ts-defaults/actions/workflows/node.yml)

[![Publish](https://github.com/charliewilco/esm-ts-defaults/actions/workflows/publish.yml/badge.svg)](https://github.com/charliewilco/esm-ts-defaults/actions/workflows/publish.yml)

An abstract class for creating a store that is compliant with [`useSyncExternalStore`](https://beta.reactjs.org/reference/react/useSyncExternalStore).

## Install

```
npm install @charliewilco/abstract-mutable-store
```

## Usage

`AbstractStore` is an abstract class that provides a common interface for creating a store that can be used with the `useSyncExternalStore` hook in React. It defines a set of methods for reading and updating the store's value, and for subscribing to changes to the store's value.

To use `AbstractStore`, simply extend the `AbstractStore` class and implement the required methods:

```ts
import { AbstractStore } from "@charliewilco/abstract-mutable-store";

interface State {
	count: number;
}

class CountStore extends AbstractStore<State> {
	constructor() {
		super({ count: 0 });
	}

	increment() {
		this.mutate((draft) => {
			draft.count += 1;
		});
	}

	decrement() {
		this.mutate((draft) => {
			draft.count -= 1;
		});
	}
}

const store = new CountStore();

store.subscribe((state) => {
	console.log(`Count: ${state.count}`);
});

store.increment();
store.increment();
store.decrement();
```

This is an [`abstract` Class](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members) so it's not meant to be called like this:

```ts
// 🙄 🛑 DON'T DO THIS
const store = new AbstractStore({ foo: 1 });
```

### With React

```tsx
import { AbstractStore } from "@charliewilco/abstract-mutable-store";
import { useSyncExternalStore } from "react";
// React v17 or lower
// import { useSyncExternalStore } from "use-sync-external-store"

interface State {
	count: number;
}

class CountStore extends AbstractStore<State> {
	constructor() {
		super({ count: 0 });
	}

	increment() {
		this.mutate((draft) => {
			draft.count += 1;
		});
	}

	decrement() {
		this.mutate((draft) => {
			draft.count -= 1;
		});
	}
}

const store = new CountStore();

function SyncedCount() {
	const { count } = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getSnapshot()
	);

	return <h1>Count: {count}</h1>;
}

function App() {
	return (
		<div>
			<SyncedCount />
			<button onClick={() => store.increment()}>Increment</button>
		</div>
	);
}
```

## License

[The Unlicense](https://unlicense.org/).
