import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';

// Utils used to access singleton instances of Split factories and clients, and to gracefully shutdown clients alltogether.

/**
 * FactoryWithClientInstances interface.
 */
export interface IFactoryWithClients extends SplitIO.ISDK {
  sharedClientInstances: { [instanceId: string]: IClientWithContext };
}

const factories: Map<SplitIO.IBrowserSettings, IFactoryWithClients> = new Map();

// idempotent operation
export function getSplitFactory(config: SplitIO.IBrowserSettings): SplitIO.ISDK {
  if (!factories.has(config)) {
    // SplitSDK is not an idempotent operation
    const newFactory = SplitSdk(config) as IFactoryWithClients;
    newFactory.sharedClientInstances = {};
    factories.set(config, newFactory);
  }
  return (factories.get(config) as SplitIO.ISDK);
}

// idempotent operation
export function getSplitSharedClient(factory: SplitIO.ISDK, key: SplitIO.SplitKey, trafficType?: string): IClientWithContext {
  // factory.client is an idempotent operation
  const client = factory.client(key, trafficType) as IClientWithContext;
  if ((factory as IFactoryWithClients).sharedClientInstances) {
    const instanceId = buildInstanceId(key, trafficType);
    (factory as IFactoryWithClients).sharedClientInstances[instanceId] = client;
  }
  return client;
}

export function destroySplitFactory(factory: IFactoryWithClients): Promise<void[]> {
  // call destroy of shared clients and main one
  const destroyPromises = Object.keys(factory.sharedClientInstances).map((instanceId) => factory.sharedClientInstances[instanceId].destroy());
  destroyPromises.push(factory.client().destroy());
  return Promise.all(destroyPromises);
}

function buildInstanceId(key: SplitIO.SplitKey | undefined, trafficType: string | undefined): string {
  // @ts-ignore
  return `${key.matchingKey ? key.matchingKey : key}-${key.bucketingKey ? key.bucketingKey : key}-${trafficType !== undefined ? trafficType : ''}`;
}

// Utils used to access client status.
// They might be removed in the future, if the JS SDK extends its public API with a `getStatus` method

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
