
# Migrating to get React SDK v1.11.0 improvements: Replacing the deprecated `SplitFactory` and `withSplitFactory` components

Starting from React SDK v1.11.0, the `SplitFactoryProvider` component is available and can replace the older `SplitFactory` and `withSplitFactory` components. The deprecated components will continue working, until they are removed in a future major release.

We recommend migrating to the new `SplitFactoryProvider` component instead. This component is a revised version of `SplitFactory` that properly handles SDK side effects (i.e., factory creation and destruction) within the React component lifecycle. By migrating, you can benefit from a number of improvements:

 - Resolution of memory leak issues in React development mode, strict mode, and server-side rendering.

 - Updating the SDK when `config` or `factory` props change.

Notable changes to consider when migrating:
 - `SplitFactoryProvider` utilizes the React Hooks API, requiring React 16.8.0 or later, while `SplitFactory` is compatible with React 16.3.0 or later.

 - When using the `config` prop with `SplitFactoryProvider`, the `factory` and `client` properties in `SplitContext` and the `manager` property in `useSplitManager` results are `null` in the first render, until the context is updated when some event is emitted on the SDK main client (ready, ready from cache, timeout, or update, depending on the configuration of the `updateOn<Event>` props of the component). This differs from the previous behavior where `factory`, `client`, and `manager` were immediately available. Nonetheless, it is not recommended to use the `client` and `factory` properties directly as better alternatives are available. For example, use the `useTrack` and `useSplitTreatments` hooks rather than the client's `track` and `getTreatments` methods.

 - Updating the `config` prop in `SplitFactoryProvider` reinitializes the SDK with the new configuration, while `SplitFactory` does not reinitialize the SDK. You should pass a reference to the configuration object (e.g., via a global variable, `useState`, or `useMemo`) rather than a new instance on each render, to avoid unnecessary reinitializations.

 - Updating the `factory` prop in `SplitFactoryProvider` replaces the current SDK instance, unlike `SplitFactory` where it is ignored.

To migrate your existing code, replace:

```javascript
const MyApp = () => {
  return (
    <SplitFactory config={mySplitConfig}>
      <MyComponent />
    </SplitFactory>
  );
};
```

or

```javascript
const MyApp = withSplitFactory(mySplitConfig)(MyComponent);
```

with:

```javascript
const MyApp = () => {
  return (
    <SplitFactoryProvider config={mySplitConfig}>
      <MyComponent />
    </SplitFactoryProvider>
  );
};
```

and consider that `factory`, `client` and `manager` properties might be `null` until the SDK has emitted some event:

```javascript
const MyComponent = () => {
  // factoryFromContext === factory, clientFromContext === client, and they are null until some SDK event is emitted
  const { factory: factoryFromContext, client: clientFromContext } = useContext(SplitContext);
  const { factory, client } = useSplitClient();

  // Example to evaluate all your flags when the SDK is ready and re-evaluate on SDK_UPDATE events
  const { manager } = useSplitManager();
  const FEATURE_FLAG_NAMES = manager ? manager.names() : [];
  const { treatments, isReady } = useSplitTreatments({ names: FEATURE_FLAG_NAMES, updateOnSdkUpdate: true }); // updateOnSdkReady is true by default

  return isReady ?
    treatments['feature-flag-1'].treatment === 'on' ?
      <FeatureOn /> :
      <FeatureOff /> :
    <LoadingPage />
}
```

# Migrating to get React SDK v1.10.0 improvements: Replacing the deprecated `useClient`, `useTreatments`, and `useManager` hooks

Starting from React SDK v1.10.0, the `useSplitClient`, `useSplitTreatments`, and `useSplitManager` hooks are available and can replace the older `useClient`, `useTreatments`, and `useManager` hooks respectively. The deprecated hooks will continue working, until they are removed in a future major release.

We recommend migrating to the new versions `useSplitClient`, `useSplitTreatments` and `useSplitManager` respectively, which provide a more flexible API:

- They accept an options object as parameter, instead of a list of parameters as their deprecated counterparts. The options object can contain the same parameters as the old hooks, plus some extra optional parameters: `updateOnSdkReady`, `updateOnSdkReadyFromCache`, `updateOnSdkTimedout`, and `updateOnSdkUpdate`, which control when the hook updates the component. For example, you can set `updateOnSdkUpdate` to `true`, which is `false` by default, to update the component when an `SDK_UPDATE` event is emitted. This is useful when you want to avoid unnecessary re-renders of your components.

- They return an object containing the SDK status properties. These properties are described in the ['Subscribe to events and changes' section](https://help.split.io/hc/en-us/articles/360038825091-React-SDK#subscribe-to-events-and-changes) and enable conditional rendering of components based on the SDK status, eliminating the need to access the Split context or use the client's `ready` promise or event listeners. For example, you can show a loading spinner until the SDK is ready, and use the `treatments` result to render the variants of your app once the SDK is ready.

The usage of the new hooks is shown below:

```js
const { client, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitClient({ splitKey: userId, updateOnSdkUpdate: true });
const { treatments, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitTreatments({ names: ['feature-flag-1'], updateOnSdkTimedout: false });
const { manager, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitManager();
```



To migrate your existing code, replace:

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

and use the status properties to conditionally render your components. For example, use the following code:

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
