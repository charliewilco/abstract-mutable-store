<h1 align="center">Abstract Mutable Store</h1>

[![Unit Tests](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/node.yml/badge.svg)](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/node.yml)

[![Publish](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/publish.yml/badge.svg)](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/publish.yml)

An abstract class for creating a tiny mutable store compatible with
[`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).

The package publishes both ESM and CommonJS bundles, plus TypeScript declarations.

## Install

```sh
npm install @charliewilco/abstract-mutable-store
```

## Usage

`AbstractMutableStore` provides the common store behavior:

- `getSnapshot()` reads the current value.
- `setValue(value)` replaces the value and notifies subscribers when it changed.
- `mutate(mutator)` clones the current value, lets you mutate the draft, then stores the
  updated value.
- `subscribe(listener)` registers a listener and returns an unsubscribe function.

To use it, extend `AbstractMutableStore` with the domain-specific methods your app needs:

```ts
import { AbstractMutableStore } from "@charliewilco/abstract-mutable-store";

interface State {
	count: number;
}

class CountStore extends AbstractMutableStore<State> {
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

This is an [`abstract` class](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members),
so create a concrete subclass instead of instantiating it directly:

```ts
// This will fail because AbstractMutableStore is abstract.
const store = new AbstractMutableStore({ foo: 1 });
```

### With React

```tsx
import { AbstractMutableStore } from "@charliewilco/abstract-mutable-store";
import { useSyncExternalStore } from "react";

interface State {
	count: number;
}

class CountStore extends AbstractMutableStore<State> {
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
		() => store.getSnapshot(),
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

## Custom equality

Stores use a JSON-based equality check by default. You can pass a custom equality function when
only part of the state should determine whether subscribers are notified:

```ts
class VersionedStore extends AbstractMutableStore<{ version: number; value: string }> {
	constructor() {
		super({ version: 1, value: "initial" }, (a, b) => a.version === b.version);
	}
}
```

## Development

```sh
npm ci
npm run check
```

The `check` script runs Prettier, TypeScript type-checking, Node's built-in test runner, and the
Rolldown build.

## License

[The Unlicense](https://unlicense.org/).
