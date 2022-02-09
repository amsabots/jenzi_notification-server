/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Pusher from "pusher";
import { RedisInstance, constants, GenericNotificationFormat } from "../config";
import cron from "node-cron";
import { pusher_filters } from ".";

const set_delay = (duration = 5000) => {
  return new Promise((res) => setTimeout(res, duration));
};

class PusherServer {
  private static instance: PusherServer;
  private _pusherClient!: Pusher;

  private constructor() {
    const { PUSHER_CLUSTER, PUSHER_ID, PUSHER_KEY, PUSHER_SECRET } =
      process.env;
    this._pusherClient = new Pusher({
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

  private async consume_messages_of_type_requests() {
    // set delay before starting this loop - allow redis to fully establish a connection
    let queued_requests = await RedisInstance.getInstance().getStoreEntries(
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

      if (filterType !== pusher_filters.request_user) return;
      if (Number(retryLimit) >= 4) {
        await RedisInstance.getInstance().removeEntry(
          requestId!,
          constants.redis_pattern.requests
        );
        return;
      } else {
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
          return await this._pusherClient.trigger(
            sourceAddress!,
            pusher_filters.request_user_timedout,
            element
          );
        }

        await this._pusherClient.trigger(
          destinationAddress!,
          filterType!,
          element
        );
        console.log(
          `[message: sent request to address specified] [source: ${sourceAddress}] [destination: ${destinationAddress}] [filter type: ${filterType}]`
        );
      }
    });
  }

  //getters
  public get pusher() {
    return this._pusherClient;
  }

  public runSenderTask() {
    cron.schedule("*/10 * * * * *", async () => {
      await this.consume_messages_of_type_requests();
    });
  }
}

export { PusherServer };
