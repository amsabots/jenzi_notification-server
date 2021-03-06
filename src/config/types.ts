export interface GenericNotificationFormat {
  requestId?: string;
  payload?: object;
  sourceAddress?: string;
  destinationAddress?: string;
  filterType?: string;
  retryLimit?: number;
}
export interface ChatMessage {
  messageId: string;
  message: string;
  delivered: boolean;
  sent: boolean;
  source: string;
  destination: string;
  tag: "message" | "info" | "error";
  createdAt: number;
}
