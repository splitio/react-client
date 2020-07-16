import { SplitFactory as SplitSDK } from '@splitsoftware/splitio';

const factories: Map<SplitIO.IBrowserSettings, SplitIO.ISDK> = new Map();

export function IdempotentSplitSDK(config: SplitIO.IBrowserSettings): SplitIO.ISDK {
  if (!factories.has(config)) {
    factories.set(config, SplitSDK(config));
  }
  return (factories.get(config) as SplitIO.ISDK);
}

// The following utils might be removed in the future, if the JS SDK extends its public API with a `getStatus` method

/**
 * ClientWithContext interface.
 */
interface IClientWithContext extends SplitIO.IClient {
  __context: {
    constants: {
      READY: 'is_ready',
      READY_FROM_CACHE: 'is_ready_from_cache',
      HAS_TIMEDOUT: 'has_timedout',
      DESTROYED: 'is_destroyed',
    },
    get: (name: string, flagCheck: boolean) => boolean | undefined,
  };
}

export interface IClientStatus {
  isReady: boolean;
  isReadyFromCache: boolean;
  hasTimedout: boolean;
  isTimedout: boolean;
  isDestroyed: boolean;
}

export function getIsReady(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.READY, true) ? true : false;
}

export function getIsReadyFromCache(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.READY_FROM_CACHE, true) ? true : false;
}

export function getHasTimedout(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.HAS_TIMEDOUT, true) ? true : false;
}

export function getIsDestroyed(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.DESTROYED, true) ? true : false;
}

export function getStatus(client: SplitIO.IClient | null): IClientStatus {
  const isReady = client ? getIsReady(client) : false;
  const hasTimedout = client ? getHasTimedout(client) : false;
  return {
    isReady,
    isReadyFromCache: client ? getIsReadyFromCache(client) : false,
    isTimedout: hasTimedout && !isReady,
    hasTimedout,
    isDestroyed: client ? getIsDestroyed(client) : false,
  };
}
