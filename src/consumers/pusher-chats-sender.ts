/* eslint-disable @typescript-eslint/no-unused-vars */
import { PusherServer } from ".";
import {
  RedisInstance,
  constants,
  ChatMessage,
  GenericNotificationFormat,
} from "../config";
import { redis_pattern } from "../config/constants";

const delay = (duration = 4000) => {
  return new Promise((res) => setTimeout(res, duration));
};

class PusherForChats {
  private pusher = PusherServer.getInstance();
  private ioredis = RedisInstance.getInstance();

  private async consumeChatMessages() {
    const key = constants.redis_pattern.chats;
    console.log(
      "===================== Consuming non sent messages to destinations ================"
    );
    for (;;) {
      this.ioredis.redis.keys(key, async (err, res) => {
        if (err) return;
        const request: Array<any> = [];
        if (res.length) {
          res.forEach((e) => {
            const d = this.ioredis.redis.hgetall(e) as unknown as ChatMessage;
            console.log(d);
            request.push(
              this.pusher.pusher.trigger(d.destinationId, "new_message", d)
            );
          });
          await Promise.all(request);
        }
      });
      await delay();
    }
  }

  private async consumeDLRMessages() {
    const key = constants.redis_pattern.chats_dlr;
    console.log(
      "===================== Consuming DLR and sending them to source ================"
    );
    for (;;) {
      this.ioredis.redis.keys(key, async (err, res) => {
        if (err) return;
        const request: Array<any> = [];
        if (res.length) {
          res.forEach((e) => {
            const d = this.ioredis.redis.hgetall(e) as unknown as ChatMessage;
            console.log(d);
            request.push(
              this.pusher.pusher.trigger(d.sourceId, "dlr_report", d)
            );
          });
          await Promise.all(request);
        }
      });
      await delay();
    }
  }

  public async startTheConsumptionProcess() {
    await this.consumeChatMessages();
    await this.consumeDLRMessages();
  }
}

export { PusherForChats };
