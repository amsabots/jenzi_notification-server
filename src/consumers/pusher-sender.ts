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
    // set delay before starting this loop - allow redis to fully establish a connection
    await set_delay(10000);
    for (;;) {
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
        if (Number(retryLimit) >= 4) return;
        else {
          element.retryLimit = Number(retryLimit!) + 1;
          await RedisInstance.getInstance().updateExistingRecord(
            requestId!,
            element,
            constants.redis_pattern.requests
          );
          if (Number(retryLimit) === 3) {
            console.log(
              `[info: resending back to source] [message: requesting for a fundi timedout waiting for fundi reply] [action: sending back to source] [destination: ${sourceAddress}] [filter type: requesting_fundi_timedout]`
            );
            return await this.pusherClient.trigger(
              sourceAddress!,
              "requesting_fundi_timedout",
              element
            );
          }

          await this.pusherClient.trigger(
            destinationAddress!,
            filterType!,
            element
          );
          console.log(
            `[message: sent request to address specified] [source: ${sourceAddress}] [destination: ${destinationAddress}] [filter type: ${filterType}]`
          );
        }
      });
      await set_delay(process.env.PUSHER_DELAY);
    }
  }
}

export { PusherServer };
