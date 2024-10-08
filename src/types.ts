import SplitIO from '@splitsoftware/splitio/types/splitio';
import type { ReactNode } from 'react';

/**
 * Split Status interface. It represents the current readiness state of the SDK.
 */
export interface ISplitStatus {

  /**
   * isReady indicates if the Split SDK client has triggered an SDK_READY event and thus is ready to be consumed.
   */
  isReady: boolean;

  /**
   * isReadyFromCache indicates if the Split SDK client has triggered an SDK_READY_FROM_CACHE event and thus is ready to be consumed,
   * although the data in cache might be stale.
   */
  isReadyFromCache: boolean;

  /**
   * isTimedout indicates if the Split SDK client has triggered an SDK_READY_TIMED_OUT event and is not ready to be consumed.
   * In other words, `isTimedout` is equivalent to `hasTimeout && !isReady`.
   */
  isTimedout: boolean;

  /**
   * hasTimedout indicates if the Split SDK client has ever triggered an SDK_READY_TIMED_OUT event.
   * It's meant to keep a reference that the SDK emitted a timeout at some point, not the current state.
   */
  hasTimedout: boolean;

  /**
   * isDestroyed indicates if the Split SDK client has been destroyed.
   */
  isDestroyed: boolean;

  /**
   * Indicates when was the last status event, either SDK_READY, SDK_READY_FROM_CACHE, SDK_READY_TIMED_OUT or SDK_UPDATE.
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
   * NOTE: This property is not recommended for direct use, as better alternatives are available.
   */
  factory: SplitIO.IBrowserSDK | null;

  /**
   * Split client instance.
   *
   * NOTE: This property is not recommended for direct use, as better alternatives are available.
   *
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
   */
  client: SplitIO.IBrowserClient | null;
}

/**
 * Update Props interface. It defines the props used to configure what SDK events are listened to update the Split context.
 * Only `SDK_UPDATE` and `SDK_READY_TIMED_OUT` are configurable.
 * The `SDK_READY` event is always listened to update the Split context value 'isReady'.
 */
export interface IUpdateProps {

  /**
   * updateOnSdkUpdate indicates if the component will update the `SplitContext` in case of a `SDK_UPDATE` event.
   * If true, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on SDK_UPDATE.
   * It's value is false by default.
   */
  updateOnSdkUpdate?: boolean;

  /**
   * updateOnSdkTimedout indicates if the component will update the `SplitContext` in case of a `SDK_READY_TIMED_OUT` event.
   * If true, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on SDK_READY_TIMED_OUT.
   * It's value is false by default.
   */
  updateOnSdkTimedout?: boolean;

  /**
   * updateOnSdkReady indicates if the component will update the `SplitContext` in case of a `SDK_READY` event.
   * If true, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on SDK_READY.
   * It's value is true by default.
   */
  updateOnSdkReady?: boolean;

  /**
   * updateOnSdkReadyFromCache indicates if the component will update the `SplitContext` in case of a `SDK_READY_FROM_CACHE` event.
   * If true, components consuming the context (such as `SplitClient` and `SplitTreatments`) will re-render on SDK_READY_FROM_CACHE.
   * This params is only relevant when using 'LOCALSTORAGE' as storage type, since otherwise the event is never emitted.
   * It's value is true by default.
   */
  updateOnSdkReadyFromCache?: boolean;
}

/**
 * SplitFactoryProvider Child Props interface. These are the props that the child component receives from the 'SplitFactoryProvider' component.
 */
// @TODO rename/remove next type (breaking-change)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISplitFactoryChildProps extends ISplitContextValues { }

/**
 * SplitFactoryProvider Props interface. These are the props accepted by SplitFactoryProvider component,
 * used to instantiate a factory and client instance, update the Split context, and listen for SDK events.
 */
export interface ISplitFactoryProps extends IUpdateProps {

  /**
   * Config object used to instantiate a Split factory
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
   */
  config?: SplitIO.IBrowserSettings;

  /**
   * Split factory instance to use instead of creating a new one with the config object.
   *
   * If both `factory` and `config` are provided, the `config` option is ignored.
   */
  factory?: SplitIO.IBrowserSDK;

  /**
   * An object of type Attributes used to evaluate the feature flags.
   */
  attributes?: SplitIO.Attributes;

  /**
   * Children of the SplitFactoryProvider component. It can be a functional component (child as a function) or a React element.
   */
  children: ((props: ISplitFactoryChildProps) => ReactNode) | ReactNode;
}

/**
 * useSplitClient options interface. This is the options object accepted by useSplitClient hook,
 * used to retrieve a client instance with the Split context, and listen for SDK events.
 */
export interface IUseSplitClientOptions extends IUpdateProps {

  /**
   * The customer identifier.
   */
  splitKey?: SplitIO.SplitKey;

  /**
   * Traffic type associated with the customer identifier.
   * If no provided here or at the config object, it will be required on the client.track() calls.
   */
  trafficType?: string;

  /**
   * An object of type Attributes used to evaluate the feature flags.
   */
  attributes?: SplitIO.Attributes;
}

/**
 * SplitClient Child Props interface. These are the props that the child component receives from the 'SplitClient' component.
 */
// @TODO remove next type (breaking-change)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
}

/**
 * useSplitTreatments options interface. This is the options object accepted by useSplitTreatments hook, used to call 'client.getTreatmentsWithConfig()', or 'client.getTreatmentsWithConfigByFlagSets()',
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
export type ISplitTreatmentsProps = GetTreatmentsOptions & {

  /**
   * Children of the SplitTreatments component. It must be a functional component (child as a function) you want to show.
   */
  children: ((props: ISplitTreatmentsChildProps) => ReactNode);
}
