# Redux and Redux-Toolkit

## Overview

This document aims to provide an overview on the approach/schema for Redux and Redux toolkit

**Useful Links**

- Redux Docs: https://redux.js.org
- Redux Recommended Practices + Style Guide: https://redux.js.org/style-guide/style-guide
- Redux Toolkit: https://redux-toolkit.js.org/
- Redux Toolkit with Typescript: https://redux-toolkit.js.org/usage/usage-with-typescript#configurestore
- Redux Toolkit API Usage: https://redux-toolkit.js.org/tutorials/rtk-query

#### Why Redux Toolkit?

Implementing Toolkit is recommended by Redux JS and provides several benefits, including:

- Providing functions building in Redux's suggested best practices
- Simplifies/cleans up code
- Simplifies logic and ensures a good base to work from

## Folder Structure

An example folder structure may look like the below given the current approach of using slices, the recommended Redux Toolkit pattern.

It's important to note that the recommended approach is to categorize these by features (see best practices link above)

```
src/
| store.ts                  [The global store]
| hooks.ts                  [Typed versions of redux hooks]
|----feature(i.e. login)/   [A feature to create the slice around]
|    |    loginAPI.ts       [Thunk/API calls required]
|    |    loginSlice.ts     [The slice to define action/reducers]
|----feature/
etc.
```

## The Flow

Whilst the code provided here is very well documented, this section aims to provide a general flow/description of how Redux/RTK is working here.

### Creating The Store

RTK provides easy ways to setup the store, at its most basic level it is done using the configureStore method.

**redux/store.ts**

```
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import counterReducer from './counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer
  }
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
```

Important to note the type exports below the store are used to support Typescript with Dispatch, State, and Thunk.

This is then wrapped around the App as with normal Redux:

**index.tsx**

```
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { store } from './redux/store';
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Generic Hooks

While we can technically import _RootState_ and _AppDispatch_ types into every component, its much easier to create typed versions of useDispatch and useSelector.

Following RTK documentation its important for the following reasons:

```
* For useSelector, it saves you the need to type (state: RootState) every time

* For useDispatch, the default Dispatch type does not know about thunks. In order to correctly dispatch thunks, you need to use the specific customized AppDispatch type from the store that includes the thunk middleware types, and use that with useDispatch. Adding a pre-typed useDispatch hook keeps you from forgetting to import AppDispatch where it's needed.
```

As such, a simple file is created as follows:

**redux/hooks.ts**

```
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

```

### Defining Slices

The createSlice method is at the core of RTKs pattern. This requires a string to identify the slice, an initial value, and one or more reducer functions to update the state.

After creation, we can export the Redux action creators/reducer function/s for the whole slice and add this to the store

For example:
**redux/counter/counterSlice.ts**

```
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount } = counterSlice.actions

export default counterSlice.reducer
```

See the above section on _store.ts_ for adding this to the store.

### Using Hooks to Interact with the Store

The flow for this phase is split into two sections:

- Reading from the store via _useSelector_
- Dispatching actions via _useDispatch_

In this code example, the Counter component implements this at a basic level as follows:

**components/Counter.tsx**

```
import React from 'react'import { RootState } from '../../app/store'import { useSelector, useDispatch } from 'react-redux'import { decrement, increment } from './counterSlice'
export function Counter() {
    const count = useSelector((state: RootState) => state.counter.value);
    const dispatch = useDispatch();

//...

// Button example, where increment is the action we want to call:
// Note as in the actual file example, variables can be passed here where required.
 <button aria-label="Increment value" onClick={() => dispatch(increment())} >
```

### Creating API via RTK

Whilst the counter example does utilise Thunk for Async queries, the below demonstrates connecting to a public API

As an example, a service is created via a baseUrl and expected endpoints.

**services/pokemon.ts**

```
// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Pokemon } from './types'

// Define a service using a base URL and expected endpoints
export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getPokemonByName: builder.query<Pokemon, string>({
      query: (name) => `pokemon/${name}`,
    }),
  }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetPokemonByNameQuery } = pokemonApi
```

With the above service, we can then add it to the store as follows:

**src/store.ts**

```
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import counterReducer from './counter/counterSlice';
import { pokemonApi } from '../services/pokemon';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [pokemonApi.reducerPath]: pokemonApi.reducer
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(pokemonApi.middleware)
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

//... Type Exports
```

### Using an API Query in a Component

As in the above example, a custom hook was exported to access the Pokemon API. While not implemented in this codebase, it could be done as follows:

```
// Imports
import { useGetPokemonByNameQuery } from './services/pokemon'

//...
// In functional component:

// Using a query hook automatically fetches data and returns query values

const { data, error, isLoading } = useGetPokemonByNameQuery('bulbasaur')

// Individual hooks are also accessible under the generated endpoints:

// const { data, error, isLoading } = pokemonApi.endpoints.getPokemonByName.useQuery('bulbasaur')
```
