/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AMQPConnection,
  constants,
  RedisInstance,
  ChatMessage,
} from "../config";

class ConsumeRabbitMessages {
  private rabbit = AMQPConnection.getInstance();
  private redis = RedisInstance.getInstance();
  //constructor thingy
  constructor() {}

  //purpose of this class
  private consumeIncomingMessages() {
    console.log(
      `Listening for messages on queue ${constants.queues.incoming_messages}`
    );
    this.rabbit.channel.consume(
      constants.queues.incoming_messages,
      async (data) => {
        const content: ChatMessage = JSON.parse(
          <never>data?.content.toString()
        );
        await this.redis.redis.hmset(
          this.sys_key(content.messageId),
          <never>content
        );
        this.rabbit.channel.ack(data!);
      }
    );
  }

  private consumeDLRReports() {
    console.log(
      `Listening for DLR messages on queue ${constants.queues.dlr_reports}`
    );
    this.rabbit.channel.consume(constants.queues.dlr_reports, async (data) => {
      const { chats, chats_dlr } = constants.redis_pattern;
      const content: ChatMessage = JSON.parse(<never>data?.content.toString());
      //remove the object from the dlr queue and create a dlr report and send it back to message owner
      await this.redis.removeEntry(content.messageId, chats);
      //create a delivery message
      await this.redis.redis.hmset(
        `${chats_dlr}:${content.messageId}`,
        <never>content
      );
      this.rabbit.channel.ack(data!);
    });
  }

  private consumeRemoveDLRReportTriggers() {
    console.log(
      `Listening for remove DLR messages on queue ${constants.queues.remove_dlr}`
    );
    this.rabbit.channel.consume(constants.queues.remove_dlr, async (data) => {
      const content = data?.content.toString().replace(/"/g, "");
      await this.redis.redis.del(
        `${constants.redis_pattern.chats_dlr}:${content}`
      );
      this.rabbit.channel.ack(data!);
    });
  }

  public initiateQueueConsumption() {
    this.consumeIncomingMessages();
    this.consumeDLRReports();
    this.consumeRemoveDLRReportTriggers();
  }
  private sys_key(key: string) {
    return `${constants.redis_pattern.chats}:${key}`;
  }
}

export { ConsumeRabbitMessages };
