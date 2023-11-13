import { ISplitContextValues } from './types';
/**
 * 'useSplitManager' is a hook that returns an Split Context object with the Manager instance from the Split factory.
 * It uses the 'useContext' hook to access the factory at Split context, which is updated by the SplitFactory component.
 *
 * @return An object containing the Split context and the Split Manager instance, which is null if used outside the scope of SplitFactory
 *
 * @example
 * ```js
 * const { manager, isReady } = useSplitManager();
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
 */
export declare function useSplitManager(): ISplitContextValues & {
    manager: SplitIO.IManager | null;
};
