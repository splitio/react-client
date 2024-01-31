# React SDK v1.11.0: replace deprecated components with the new `SplitFactoryProvider` component

The `SplitFactory` and `withSplitFactory` components have been deprecated since React SDK v1.11.0, and will be removed on a future major release.

We recommend migrating to the new `SplitFactoryProvider` component instead. This component is a revised version of `SplitFactory` that properly handles SDK side effects (factory creation and destruction) within the React component lifecycle, resolving memory leak issues in React development mode, strict mode and server-side rendering, and also ensuring that the SDK is updated if `config` or `factory` props change.

Notable changes to consider when migrating:
 - `SplitFactoryProvider` utilizes the React Hooks API, requiring React 16.8.0 or later, while `SplitFactory` is compatible with React 16.3.0 or later.

 - When using the `config` prop with `SplitFactoryProvider`, `factory` and `client` properties in `SplitContext` are `null` in the first render, until the context is updated when some event is emitted on the SDK main client (ready, ready from cache, timeout or update depending on the configuration of the `updateOn<Event>` props of the component). This differs from the previous behavior where `factory` and `client` were immediately available. Nonetheless, it is not recommended to use the `client` and `factory` properties directly as better alternatives are available. For example, use the `useTrack` and `useSplitTreatments` hooks rather than the client's `track` and `getTreatments` methods.

 - Updating the `config` prop in `SplitFactoryProvider` reinitializes the SDK with the new configuration, while `SplitFactory` does not reinitialize the SDK. It is recommended to pass a reference to the configuration object (e.g., via a global variable, `useState`, or `useMemo`) rather than a new instance on each render, to avoid unnecessary reinitializations.

 - Updating the `factory` prop in `SplitFactoryProvider` replaces the current SDK instance, unlike `SplitFactory` where it is ignored.

# React SDK v1.10.0: replace deprecated hooks with new ones

The `useClient`, `useTreatments` and `useManager` hooks have been deprecated since React SDK v1.10.0, and will be removed on a future major release.

We recommend migrating to the new versions `useSplitClient`, `useSplitTreatments` and `useSplitManager` respectively, which provide a more flexible API:

- They accept extra optional parameters, `updateOnSdkReady`, `updateOnSdkReadyFromCache`, `updateOnSdkTimedout` and `updateOnSdkUpdate`, which enable to control when the hook updates the component. For example, you can set `updateOnSdkReady` to `true`, which is `false` by default, to update the component when an `SDK_UPDATE` event is emitted. This is useful when you want to avoid unnecessary re-renders of your components.

- They return an object containing the SDK status properties. These properties are described in the ['Subscribe to events and changes' section](https://help.split.io/hc/en-us/articles/360038825091-React-SDK#subscribe-to-events-and-changes) and enable conditional rendering of components based on the SDK status, eliminating the need to access the Split context or using the client's `ready` promise or event listeners. For example, you can show a loading spinner while the SDK is not ready, and use the `treatments` result to render the variants of your App once the SDK is ready.

```js
const { client, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitClient();
const { treatments, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitTreatments({ names: ['feature-flag-1'] });
const { manager, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitManager();
```



To refactor your existing code, replace:

```javascript
const client = useClient(optionalSplitKey, optionalTrafficType, optionalAttributes);
const treatments = useTreatments(featureFlagNames, optionalAttributes, optionalSplitKey);
const manager = useManager();
```

with:

```javascript
const { client } = useSplitClient({ splitKey: optionalSplitKey, trafficType: optionalTrafficType, attributes: optionalAttributes });
const { treatments } = useSplitTreatments({ names: featureFlagNames, attributes: optionalAttributes, splitKey: optionalSplitKey });
const { manager } = useSplitManager();
```

and use the status properties to conditionally render your components. For example, do:

```javascript
const MyComponent = ({ userId }) => {

  const { treatments, isReady } = useSplitTreatments({ names: [FEATURE_X], splitKey: userId })

  return isReady ?
    treatments[FEATURE_X].treatment === 'on' ?
      <FeatureOn /> :
      <FeatureOff /> :
    <LoadingPage />
}
```

instead of:

```javascript
const MyComponent = ({ userId }) => {

  const [sdkIsReady, setSdkIsReady] = useState(false);
  const client = useClient(userId);
  const treatments = useTreatments([FEATURE_X], undefined, userId);

  useEffect(() => {
    if (client) client.ready().then(() => setSdkIsReady(true));
  }, [client]);

  return isReady ?
    treatments[FEATURE_X].treatment === 'on' ?
      <FeatureOn /> :
      <FeatureOff /> :
    <LoadingPage />
}
```
