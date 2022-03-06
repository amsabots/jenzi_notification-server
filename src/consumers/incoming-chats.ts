/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AMQPConnection, constants, ChatMessage } from "../config";
import randomgen from "randomstring";
import { firebase_db } from "../config/firebase";
import { set, ref, update } from "firebase/database";

class ConsumeRabbitMessages {
  private rabbit = AMQPConnection.getInstance();
  //constructor thingy
  constructor() {}

  private consumeIncomingChats() {
    console.log(`[info: consuming incoming chats message]`);
    this.rabbit.channel.consume(constants.queues.incoming_messages, (data) => {
      const messageId = randomgen.generate({ charset: "hex" });
      const { source, destination, chatroomId, message, tag } = JSON.parse(
        <any>data?.content.toString()
      );

      set(ref(firebase_db, `chats/${chatroomId}/${messageId}`), {
        destination,
        source,
        message: message,
        tag: tag || "message",
        createdAt: new Date().getTime(),
        delivered: false,
        sent: true,
      });
      console.log(
        `[info: chat message sent] [destination: ${destination}] [source: ${source}]`
      );
      this.rabbit.channel.ack(data!);
    });
  }

  private updateMessage() {
    console.log(`consuming update requests`);
    this.rabbit.channel.consume(constants.queues.update_messages, (data) => {
      const { messageId, chatroomId, isDelivered, isDeleted } = JSON.parse(
        <any>data?.content.toString()
      );
      update(ref(firebase_db, `${chatroomId}/${messageId}`), {
        delivered: isDelivered,
        deleted: isDeleted,
      });
      this.rabbit.channel.ack(data!);
    });
  }

  public initiateQueueConsumption() {
    this.consumeIncomingChats();
    this.updateMessage();
  }
}

export { ConsumeRabbitMessages };
