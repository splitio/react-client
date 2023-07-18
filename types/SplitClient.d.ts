/// <reference types="react" />
import { ISplitClientProps } from './types';
/**
 * SplitClient will initialize a new SDK client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * Unlike SplitFactory, the underlying SDK client can be changed during the component lifecycle
 * if the component is updated with a different splitKey or trafficType prop. Since the client can change,
 * its release is not handled by SplitClient but by its container SplitFactory component.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export declare function SplitClient(props: ISplitClientProps): JSX.Element;
