/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Pusher from "pusher";
import {
  GenericNotificationFormat,
  AMQPConnection,
  AppConstants,
  RedisInstance,
  constants,
} from "../config";

const set_delay = (duration = 5000) => {
  return new Promise((res) => setTimeout(res, duration));
};

class PusherServer {
  private static instance: PusherServer;
  private pusherClient!: Pusher;

  private constructor() {
    const { PUSHER_CLUSTER, PUSHER_ID, PUSHER_KEY, PUSHER_SECRET } =
      process.env;
    this.pusherClient = new Pusher({
      cluster: PUSHER_CLUSTER,
      appId: PUSHER_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
    });
  }

  public static getInstance(): PusherServer {
    if (!PusherServer.instance) PusherServer.instance = new PusherServer();
    return PusherServer.instance;
  }

  public async consume_messages_of_type_requests() {
    await set_delay(10000);
    const queued_requests = await RedisInstance.getInstance().getStoreEntries(
      constants.redis_pattern.requests
    );
    queued_requests.forEach(async (element) => {
      const {
        destinationAddress,
        filterType,
        payload,
        requestId,
        retryLimit,
        sourceAddress,
      } = element;

      if (retryLimit! >= 5) return;
      await this.pusherClient.trigger(
        destinationAddress!,
        filterType!,
        element
      );
      element.retryLimit = retryLimit! + 1;
    });
  }
}

export { PusherServer };
