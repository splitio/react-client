/**
 * ClientWithContext interface.
 */
export interface IClientWithContext extends SplitIO.IClient {
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

export function getIsReady(client: IClientWithContext | null) {
  return client && client.__context.get(client.__context.constants.READY, true) ? true : false;
}

export function getIsReadyFromCache(client: IClientWithContext | null) {
  return client && client.__context.get(client.__context.constants.READY_FROM_CACHE, true) ? true : false;
}

export function getHasTimedout(client: IClientWithContext | null) {
  return client && client.__context.get(client.__context.constants.HAS_TIMEDOUT, true) ? true : false;
}

export function getIsDestroyed(client: IClientWithContext | null) {
  return client && client.__context.get(client.__context.constants.DESTROYED, true) ? true : false;
}

export function getStatus(client: IClientWithContext | null): IClientStatus {
  const isReady = getIsReady(client);
  const hasTimedout = getHasTimedout(client);
  return {
    isReady,
    isReadyFromCache: getIsReadyFromCache(client),
    isTimedout: hasTimedout && !isReady,
    hasTimedout,
    isDestroyed: getIsDestroyed(client),
  };
}
