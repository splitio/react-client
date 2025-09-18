import { useSplitClient } from './useSplitClient';
import { IUseSplitManagerResult } from './types';
import { useSplitContext } from './SplitContext';

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
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#manager}
 */
export function useSplitManager(): IUseSplitManagerResult {
  // @TODO refactor next lines to `const context = useSplitClient();` when `SplitClient` is removed
  // This is required to avoid retrieving the status of a non-default client if context was updated by a `SplitClient` component.
  const { factory } = useSplitContext();
  const context = useSplitClient({ splitKey: factory?.settings.core.key });

  const manager = factory ? factory.manager() : undefined;

  return {
    ...context,
    manager,
  };
}
