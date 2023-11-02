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
     * Split factory instance
     */
    factory: SplitIO.IBrowserSDK | null;
    /**
     * Split client instance
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
 * SplitFactory Child Props interface. These are the props that the child component receives from the 'SplitFactory' component.
 */
export interface ISplitFactoryChildProps extends ISplitContextValues {
}
/**
 * SplitFactory Props interface. These are the props accepted by SplitFactory component,
 * used to instantiate a factory and client instances, update the Split context, and listen for SDK events.
 */
export interface ISplitFactoryProps extends IUpdateProps {
    /**
     * Config object used to instantiate a Split factory
     * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
     */
    config?: SplitIO.IBrowserSettings;
    /**
     * Split factory instance to use instead of creating a new one with the config object.
     */
    factory?: SplitIO.IBrowserSDK;
    /**
     * An object of type Attributes used to evaluate the feature flags.
     */
    attributes?: SplitIO.Attributes;
    /**
     * Children of the SplitFactory component. It can be a functional component (child as a function) or a React element.
     */
    children: ((props: ISplitFactoryChildProps) => ReactNode) | ReactNode;
}
/**
 * SplitClient Child Props interface. These are the props that the child component receives from the 'SplitClient' component.
 */
export interface ISplitClientChildProps extends ISplitContextValues {
}
/**
 * SplitClient Props interface. These are the props accepted by SplitClient component,
 * used to instantiate a new client instances, update the Split context, and listen for SDK events.
 */
export interface ISplitClientProps extends IUpdateProps {
    /**
     * The customer identifier.
     */
    splitKey: SplitIO.SplitKey;
    /**
     * Traffic type associated with the customer identifier.
     * If no provided here or at the config object, it will be required on the client.track() calls.
     */
    trafficType?: string;
    /**
     * An object of type Attributes used to evaluate the feature flags.
     */
    attributes?: SplitIO.Attributes;
    /**
     * Children of the SplitFactory component. It can be a functional component (child as a function) or a React element.
     */
    children: ((props: ISplitClientChildProps) => ReactNode) | ReactNode;
}
/**
 * SplitTreatments Child Props interface. These are the props that the child component receives from the 'SplitTreatments' component.
 */
export interface ISplitTreatmentsChildProps extends ISplitContextValues {
    /**
     * An object with the treatments with configs for a bulk of feature flags, returned by client.getTreatmentsWithConfig().
     * Each existing configuration is a stringified version of the JSON you defined on the Split user interface. For example:
     *   {
     *     split1: { treatment: 'on', config: null }
     *     split2: { treatment: 'off', config: '{"bannerText":"Click here."}' }
     *   }
     */
    treatments: SplitIO.TreatmentsWithConfig;
}
/**
 * SplitTreatments Props interface. These are the props accepted by SplitTreatments component,
 * used to call 'client.getTreatmentsWithConfig()' and pass the result to the child component.
 */
export interface ISplitTreatmentsProps {
    /**
     * list of feature flag names
     */
    names: string[];
    /**
     * An object of type Attributes used to evaluate the feature flags.
     */
    attributes?: SplitIO.Attributes;
    /**
     * Children of the SplitTreatments component. It must be a functional component (child as a function) you want to show.
     */
    children: ((props: ISplitTreatmentsChildProps) => ReactNode);
}
