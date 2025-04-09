import type { ReactNode } from 'react';

/**
 * Split Status interface. It represents the readiness state of an SDK client.
 */
export interface ISplitStatus {

  /**
   * `isReady` indicates if the Split SDK client has triggered an `SDK_READY` event and thus is ready to be consumed.
   */
  isReady: boolean;

  /**
   * `isReadyFromCache` indicates if the Split SDK client has triggered an `SDK_READY_FROM_CACHE` event and thus is ready to be consumed,
   * although the data in cache might be stale.
   */
  isReadyFromCache: boolean;

  /**
   * `isTimedout` indicates if the Split SDK client has triggered an `SDK_READY_TIMED_OUT` event and is not ready to be consumed.
   * In other words, `isTimedout` is equivalent to `hasTimedout && !isReady`.
   */
  isTimedout: boolean;

  /**
   * `hasTimedout` indicates if the Split SDK client has ever triggered an `SDK_READY_TIMED_OUT` event.
   * It's meant to keep a reference that the SDK emitted a timeout at some point, not the current state.
   */
  hasTimedout: boolean;

  /**
   * `isDestroyed` indicates if the Split SDK client has been destroyed.
   */
  isDestroyed: boolean;

  /**
   * Indicates when was the last status event, either `SDK_READY`, `SDK_READY_FROM_CACHE`, `SDK_READY_TIMED_OUT` or `SDK_UPDATE`.
   */
  lastUpdate: number;
}

/**
 * Split Context Value interface. It is used to define the value types of Split Context
 */
export interface ISplitContextValues extends ISplitStatus {

  /**
   * Split factory instance.
   *
   * NOTE: This property is available for accessing factory methods not covered by the library hooks,
   * such as Logging configuration and User Consent.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#logging}),
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#user-consent}
   */
  factory?: SplitIO.IBrowserSDK;

  /**
   * Split client instance.
   *
   * NOTE: This property is not recommended for direct use, as better alternatives are available:
   * - `useSplitTreatments` hook to evaluate feature flags.
   * - `useTrack` hook to track events.
   *
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
   */
  client?: SplitIO.IBrowserClient;
}

/**
 * Update Props interface. It defines the props used to configure what SDK events are listened to update the component.
 */
export interface IUpdateProps {

  /**
   * `updateOnSdkUpdate` indicates if the component will update (i.e., re-render) in case of an `SDK_UPDATE` event.
   * If `true`, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on `SDK_UPDATE`.
   * It's value is `true` by default.
   */
  updateOnSdkUpdate?: boolean;

  /**
   * `updateOnSdkTimedout` indicates if the component will update (i.e., re-render) in case of a `SDK_READY_TIMED_OUT` event.
   * If `true`, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on `SDK_READY_TIMED_OUT`.
   * It's value is `true` by default.
   */
  updateOnSdkTimedout?: boolean;

  /**
   * `updateOnSdkReady` indicates if the component will update (i.e., re-render) in case of a `SDK_READY` event.
   * If `true`, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on `SDK_READY`.
   * It's value is `true` by default.
   */
  updateOnSdkReady?: boolean;

  /**
   * `updateOnSdkReadyFromCache` indicates if the component will update (i.e., re-render) in case of a `SDK_READY_FROM_CACHE` event.
   * If `true`, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on `SDK_READY_FROM_CACHE`.
   * This params is only relevant when using `'LOCALSTORAGE'` as storage type, since otherwise the event is never emitted.
   * It's value is `true` by default.
   */
  updateOnSdkReadyFromCache?: boolean;
}

/**
 * Props interface for components wrapped by the `withSplitFactory` HOC. These props are provided by the HOC to the wrapped component.
 *
 * @deprecated `withSplitFactory` will be removed in a future major release. We recommend replacing it with the `SplitFactoryProvider` component.
 */
export interface ISplitFactoryChildProps extends ISplitContextValues { }

/**
 * SplitFactoryProvider Props interface. These are the props accepted by the `SplitFactoryProvider` component,
 * used to instantiate a factory and provide it to the Split Context.
 */
export interface ISplitFactoryProviderProps {

  /**
   * Config object used to instantiate a Split factory.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
   */
  config?: SplitIO.IBrowserSettings;

  /**
   * Split factory instance to use instead of creating a new one with the `config` object.
   *
   * If both `factory` and `config` are provided, the `config` prop is ignored.
   */
  factory?: SplitIO.IBrowserSDK;

  /**
   * An object of type Attributes used to evaluate the feature flags.
   */
  attributes?: SplitIO.Attributes;

  /**
   * Children of the `SplitFactoryProvider` component.
   */
  children: ReactNode;
}

/**
 * Options object accepted by the `useSplitClient` hook, used to retrieve a client instance and update the component on SDK events.
 */
export interface IUseSplitClientOptions extends IUpdateProps {

  /**
   * The customer identifier. If not provided, the hook will use the client available in the Split context, which is the default client by default (i.e., `factory.client()`),
   * except the hook is wrapped by a `SplitClient` component, in which case the Split context might be updated with a different client.
   */
  splitKey?: SplitIO.SplitKey;

  /**
   * An object of type Attributes used to evaluate the feature flags.
   */
  attributes?: SplitIO.Attributes;
}

/**
 * SplitClient Child Props interface. These are the props that the child as a function receives from the 'SplitClient' component.
 */
export interface ISplitClientChildProps extends ISplitContextValues { }

/**
 * SplitClient Props interface. These are the props accepted by SplitClient component,
 * used to instantiate a new client instance, update the Split context, and listen for SDK events.
 */
export interface ISplitClientProps extends IUseSplitClientOptions {

  /**
   * Children of the SplitClient component. It can be a functional component (child as a function) or a React element.
   */
  children: ((props: ISplitClientChildProps) => ReactNode) | ReactNode;
}

export interface IUseSplitManagerResult extends ISplitContextValues {
  /**
   * Split manager instance.
   *
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
   */
  manager?: SplitIO.IManager;
}

export type GetTreatmentsOptions = ({

  /**
   * List of feature flag names to evaluate. Either this or the `flagSets` property must be provided. If both are provided, the `flagSets` option is ignored.
   */
  names: string[];
  flagSets?: undefined;
} | {

  /**
   * List of feature flag sets to evaluate. Either this or the `names` property must be provided. If both are provided, the `flagSets` option is ignored.
   */
  flagSets: string[];
  names?: undefined;
}) & {

  /**
   * An object of type Attributes used to evaluate the feature flags.
   */
  attributes?: SplitIO.Attributes;

  /**
   * Optional properties to append to the generated impression object sent to Split backend.
   */
  properties?: SplitIO.Properties;
}

/**
 * Options object accepted by the `useSplitTreatments` hook, used to call `client.getTreatmentsWithConfig()`, or `client.getTreatmentsWithConfigByFlagSets()`,
 * depending on whether `names` or `flagSets` options are provided, and to retrieve the result along with the Split context.
 */
export type IUseSplitTreatmentsOptions = GetTreatmentsOptions & IUseSplitClientOptions;

/**
 * SplitTreatments Child Props interface. These are the props that the child component receives from the 'SplitTreatments' component.
 */
export interface ISplitTreatmentsChildProps extends ISplitContextValues {

  /**
   * An object with the treatments with configs for a bulk of feature flags, returned by client.getTreatmentsWithConfig().
   * Each existing configuration is a stringified version of the JSON you defined on the Split user interface. For example:
   *
   * ```js
   *   {
   *     feature1: { treatment: 'on', config: null },
   *     feature2: { treatment: 'off', config: '{"bannerText":"Click here."}' }
   *   }
   * ```
   */
  treatments: SplitIO.TreatmentsWithConfig;
}

/**
 * SplitTreatments Props interface. These are the props accepted by SplitTreatments component, used to call 'client.getTreatmentsWithConfig()', or 'client.getTreatmentsWithConfigByFlagSets()',
 * depending on whether `names` or `flagSets` props are provided, and to pass the result to the child component.
 */
export type ISplitTreatmentsProps = IUseSplitTreatmentsOptions & {

  /**
   * Children of the SplitTreatments component. It must be a functional component (child as a function) you want to show.
   */
  children: ((props: ISplitTreatmentsChildProps) => ReactNode);
}
