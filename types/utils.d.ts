import SplitIO from '@splitsoftware/splitio/types/splitio';
import { IClientWithStatus } from './types';
export declare function getClientWithStatus(factory: SplitIO.ISDK, key?: SplitIO.SplitKey, trafficType?: string): IClientWithStatus;
