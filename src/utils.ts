import SplitIO from '@splitsoftware/splitio/types/splitio';
import { IClientWithStatus } from './types';

export function getClientWithStatus(factory: SplitIO.ISDK, key?: SplitIO.SplitKey, trafficType?: string): IClientWithStatus {

  const client = (key ? factory.client(key, trafficType) : factory.client()) as IClientWithStatus;
  if (!client._trackingStatus) {
    // We cannot use event listeners, since clients might be already Ready or Timedout
    client.ready().then(() => {
      client.isReady = true;
    }, () => {
      client.isTimedout = true;
      // register a listener for SDK_READY event, that might trigger after a timeout
      client.once(client.Event.SDK_READY, () => {
        client.isReady = true;
      });
    });
    client._trackingStatus = true;
    client.isReady = false;
    client.isTimedout = false;
  }

  return client;
}
