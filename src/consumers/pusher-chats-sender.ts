/* eslint-disable @typescript-eslint/no-unused-vars */
import { PusherServer } from ".";
import {
  RedisInstance,
  constants,
  ChatMessage,
  GenericNotificationFormat,
} from "../config";
import { redis_pattern } from "../config/constants";
import cron from "node-cron";

const delay = (duration = 4000) => {
  return new Promise((res) => setTimeout(res, duration));
};

class PusherForChats {
  private pusher = PusherServer.getInstance();
  private ioredis = RedisInstance.getInstance();

  private async consumeChatMessages() {
    const key = constants.redis_pattern.chats;
    this.ioredis.redis.keys(key + ":*", async (err, res) => {
      if (err) return;
      const request: Array<any> = [];
      if (res.length) {
        res.forEach(async (e) => {
          const d = (await this.ioredis.redis.hgetall(
            e
          )) as unknown as ChatMessage;

          request.push(
            this.pusher.pusher.trigger(d.destinationId, "new_message", d)
          );
        });
        await Promise.all(request);
      }
    });
  }

  private async consumeDLRMessages() {
    const key = constants.redis_pattern.chats_dlr;

    this.ioredis.redis.keys(key + ":*", async (err, res) => {
      if (err) return;
      const request: Array<any> = [];
      if (res.length) {
        res.forEach(async (e) => {
          const d = (await this.ioredis.redis.hgetall(
            e
          )) as unknown as ChatMessage;
          request.push(this.pusher.pusher.trigger(d.sourceId, "dlr_report", d));
        });
        await Promise.all(request);
      }
    });
    await delay();
  }

  public startTheConsumptionProcess() {
    cron.schedule("*/5 * * * * *", async () => {
      await this.consumeChatMessages();
      await this.consumeDLRMessages();
    });
  }
}

export { PusherForChats };
