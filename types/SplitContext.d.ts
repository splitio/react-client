/// <reference types="react" />
import { ISplitContextValues } from './types';
/**
 * Split Context is the React Context instance that represents our SplitIO global state.
 * It contains Split SDK objects, such as a factory instance, a client and its status (isReady, isTimedout, lastUpdate)
 * The context is created with default empty values, that eventually SplitFactory and SplitClient access and update.
 */
declare const SplitContext: import("react").Context<ISplitContextValues>;
export default SplitContext;
export { ISplitContextValues };
