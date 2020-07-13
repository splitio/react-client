/// <reference types="react" />
import { ISplitClientProps } from './types';
/**
 * SplitClient will initialize a new Split Client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
declare function SplitClient(props: ISplitClientProps): JSX.Element;
export default SplitClient;
