export interface GenericNotificationFormat {
  requestId?: string;
  payload?: object;
  sourceAddress?: string;
  destinationAddress?: string;
  filterType?: string;
  retryLimit?: number;
}
