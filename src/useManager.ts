import { useSplitManager } from './useSplitManager';

/**
 * 'useManager' is a hook that returns the Manager instance from the Split factory.
 * It uses the 'useContext' hook to access the factory at Split context, which is updated by
 * the SplitFactoryProvider component.
 *
 * @returns A Split Manager instance, or null if used outside the scope of SplitFactoryProvider or factory is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
 *
 * @deprecated Replace with the new `useSplitManager` hook.
 */
export function useManager(): SplitIO.IManager | null {
  return useSplitManager().manager;
}
