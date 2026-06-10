<h1 align="center">Abstract Mutable Store</h1>

[![Unit Tests](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/node.yml/badge.svg)](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/node.yml)

[![Publish](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/publish.yml/badge.svg)](https://github.com/charliewilco/abstract-mutable-store/actions/workflows/publish.yml)

Abstract Mutable Store is a tiny TypeScript base class for building app-specific external stores
whose domain methods update state by mutating drafts. It owns the common snapshot, subscription,
draft cloning, equality, and [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
compatibility so concrete store classes can focus on domain behavior.

The package is intentionally a store primitive, not a React hook library or an immutable-state
framework. React is the primary integration target, but the core API is framework-agnostic.

The package publishes both ESM and CommonJS bundles, plus TypeScript declarations.

## Install

```sh
npm install @charliewilco/abstract-mutable-store
```

## Usage

`AbstractMutableStore` is the primary API. Extend it with the domain-specific methods your app
needs:

- `getSnapshot()` reads the current value.
- `setValue(value)` replaces the value and notifies subscribers when it changed.
- `update(updater)` clones the current value, lets you mutate the draft, then stores the
  updated value.
- `mutate(mutator)` is a compatibility alias for `update(updater)`.
- `subscribe(listener)` registers a listener and returns an unsubscribe function.

The standalone `mutate`, `cloneValue`, and `isEqual` exports are helpers that use the same default
state semantics as the store. They are not a separate store API.

### Draft authoring model

Store methods should usually read like ordinary domain operations. Mutate the draft directly inside
`update()`, and let the store handle cloning, equality, committing, and notifying subscribers:

```ts
interface Todo {
	readonly id: string;
	readonly title: string;
	readonly done: boolean;
}

interface TodoState {
	readonly todos: ReadonlyArray<Todo>;
}

class TodoStore extends AbstractMutableStore<TodoState> {
	addTodo(title: string) {
		this.update((draft) => {
			draft.todos.push({
				id: crypto.randomUUID(),
				title,
				done: false,
			});
		});
	}

	completeTodo(id: string) {
		this.update((draft) => {
			const todo = draft.todos.find((item) => item.id === id);

			if (todo) {
				todo.done = true;
			}
		});
	}
}
```

Drafts are typed as mutable even when the public snapshot type uses `readonly` fields or
`ReadonlyArray`. That is a TypeScript-only authoring convenience; snapshots returned from
`getSnapshot()` should still be treated as store-owned values and updated through domain methods.

This is inspired by Immer's authoring model, but it is not an Immer replacement. The default draft
behavior uses `structuredClone()` before running your updater, then the store's equality function
decides whether to commit and notify. It does not provide proxy-based structural sharing, patch
generation, or Immer's full collection of draft semantics.

### State model

By default, `update()` clones state with
[`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone), so
state can include primitives, arrays, plain objects, `Date`, `Map`, `Set`, `ArrayBuffer`, typed
arrays, `undefined` fields, and circular references. The default equality function is cycle-aware
and compares those shapes without JSON serialization.

Values that `structuredClone` cannot clone, such as functions, `WeakMap`, `WeakSet`, promises, and
symbol values inside objects, require a custom clone function before they can be used with
`update()`. Custom class instances should also provide a clone function when prototype identity or
methods need to be preserved.

Use `setValue()` or a custom `clone` option when replacement semantics are clearer than draft
mutation.

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
		this.update((draft) => {
			draft.count += 1;
		});
	}

	decrement() {
		this.update((draft) => {
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

Create app-wide store instances outside React render paths, then subscribe to them with
`useSyncExternalStore`. React will call `getSnapshot()` during render, subscribe after commit, and
re-render only after the store notifies it that a committed value changed.

```tsx
import { AbstractMutableStore } from "@charliewilco/abstract-mutable-store";
import { useSyncExternalStore } from "react";

interface CounterState {
	count: number;
}

class CounterStore extends AbstractMutableStore<CounterState> {
	constructor() {
		super({ count: 0 });
	}

	increment() {
		this.update((draft) => {
			draft.count += 1;
		});
	}

	decrement() {
		this.update((draft) => {
			draft.count -= 1;
		});
	}
}

const counterStore = new CounterStore();

function useCounterState() {
	return useSyncExternalStore(
		(listener) => counterStore.subscribe(listener),
		() => counterStore.getSnapshot(),
		() => counterStore.getSnapshot(),
	);
}

function Counter() {
	const { count } = useCounterState();

	return (
		<section>
			<h1>Count: {count}</h1>
			<button type="button" onClick={() => counterStore.decrement()}>
				Decrement
			</button>
			<button type="button" onClick={() => counterStore.increment()}>
				Increment
			</button>
		</section>
	);
}

function App() {
	return <Counter />;
}
```

Keep the store instance stable. A module-level singleton is appropriate for shared client-side app
state, because every component subscribes to the same listener set and reads the same snapshot. Do
not create a new store in a component body; that resets state on render and gives React a different
subscription target. If the state is request-specific or user-specific during server rendering,
create the store in that request scope and pass it through your app rather than sharing one process
singleton.

Subscriptions are change notifications, not event replay. `subscribe(listener)` stores the listener
and returns an unsubscribe function; it does not call the listener immediately. React gets the first
value from `getSnapshot()`, then the store calls listeners only when `setValue()` or `update()`
commits a value that is not equal according to the store equality function. Avoid mutating the object
returned by `getSnapshot()` directly; expose domain methods that call `setValue()` or `update()` so
the store can clone, compare, update, and notify consistently.

The wrapper functions around `subscribe()` and `getSnapshot()` are intentional. Class methods are
not automatically bound in JavaScript, so passing `counterStore.subscribe` directly would lose its
`this` value.

This package does not currently export a React helper or selector hook. Read the full store snapshot
with `useSyncExternalStore` and derive values during render, or split state into smaller stores when
components need narrower updates. A future `useStore()` or `useStoreSelector()` API should live in a
separate React entrypoint with React as a peer dependency, keeping React out of the core package
dependency graph.

### Compared with BehaviorSubject

`BehaviorSubject` from RxJS is a close mental model for React external stores: it keeps a current
value, lets subscribers observe future changes, and can expose the current value synchronously for
`useSyncExternalStore`.

`AbstractMutableStore` is intentionally narrower. It is useful when you want a small, framework-free
store class with domain methods, built-in clone/equality behavior, and no observable pipeline API.
Instead of pushing arbitrary values through `.next()`, consumers call methods such as `increment()`
or `renameProject()` that decide whether to use `setValue()` or `update()`. Subscribers are notified
only after the committed value changes according to the store equality function.

Use `BehaviorSubject` when your app already depends on RxJS or needs observable composition,
operators, multicasting, cancellation, or stream interop. Use this package when the store is mostly
a synchronous state holder for React-compatible snapshots and you want the public API to be a
domain-specific class rather than an observable stream.

## Custom clone and equality

Stores use a cycle-aware deep equality check by default. It compares `Date` values by timestamp,
preserves the difference between missing fields and `undefined` fields, and treats functions as
equal only when they are the same reference.

You can pass a custom equality function when only part of the state should determine whether
subscribers are notified:

```ts
class VersionedStore extends AbstractMutableStore<{ version: number; value: string }> {
	constructor() {
		super({ version: 1, value: "initial" }, (a, b) => a.version === b.version);
	}
}
```

For state that needs custom cloning semantics, pass an options object with `clone`. The options
object can also contain `equality`:

```ts
interface State {
	callback: () => void;
	label: string;
}

class CallbackStore extends AbstractMutableStore<State> {
	constructor(callback: () => void) {
		super(
			{ callback, label: "ready" },
			{
				clone: (state) => ({ ...state }),
				equality: (a, b) => a.label === b.label && a.callback === b.callback,
			},
		);
	}
}
```

## Future API ideas

This package currently promises the subclass-based store primitive described above. A concrete
`createStore` helper is tracked in
[#3](https://github.com/charliewilco/abstract-mutable-store/issues/3). React helper hooks or
selector support should be introduced only as a separate optional entrypoint, not as part of the
framework-agnostic core export.

## Development

```sh
npm ci
npm run check
```

The `check` script runs Prettier, TypeScript type-checking, Node's built-in test runner, and the
Rolldown build.

## License

[The Unlicense](https://unlicense.org/).
