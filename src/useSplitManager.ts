import { useSplitContext } from './SplitContext';
import { ISplitContextValues } from './types';

/**
 * 'useSplitManager' is a hook that returns an Split Context object with the Manager instance from the Split factory.
 * It uses the 'useContext' hook to access the factory at Split context, which is updated by the SplitFactoryProvider component.
 *
 * @returns An object containing the Split context and the Split Manager instance, which is undefined if factory is not ready.
 *
 * @example
 * ```js
 * const { manager, isReady } = useSplitManager();
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
 */
export function useSplitManager(): ISplitContextValues & { manager?: SplitIO.IManager } {
  // Update options are not supported, because updates can be controlled at the SplitFactoryProvider component.
  const context = useSplitContext();
  return {
    ...context,
    manager: context.factory ? context.factory.manager() : undefined
  };
}
