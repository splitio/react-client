import { useSplitClient } from './useSplitClient';
import { IUseSplitManagerResult } from './types';

/**
 * `useSplitManager` is a hook that returns an Split Context object with the manager instance from the Split factory.
 *
 * @returns A Split Context object merged with the manager and its status.
 *
 * @example
 * ```js
 * const { manager, isReady, isReadyFromCache, lastUpdate, ... } = useSplitManager();
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
 */
export function useSplitManager(): IUseSplitManagerResult {
  const context = useSplitClient();

  const manager = context.factory ? context.factory.manager() : undefined;

  return {
    ...context,
    manager,
  };
}
