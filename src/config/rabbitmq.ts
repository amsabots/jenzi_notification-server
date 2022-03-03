/* eslint-disable no-empty */
import amqp, { Channel } from "amqplib";
import { queues } from "./constants";
import Pusher from "pusher";
import events from "events";
import { constants } from ".";

/**
 *  Notification and realtime data system using rabbit MQ
 * This class should initialize and maintain connection to rabbit MQ instance - It should provide a payload handler for various reasons
 *
 * Current design involves staged functions as listed below
 *  - Receive data payload from called url
 *  - The URL handling incoming data should place the payload contained inside the body
 *  - Payload format should strictly follow the following format
 *        - Please note deserialization to an object in strictly typed languages will throw an unrecoverable error
 *    ================ DATA PAYLOAD RULES ===============
 *   - sourceAddress - a unique user ID representing the client source pusher channel subscribed to
 *   - filterType - A uniq labe representing the type of data carried
 *   - destinationAddress - a unique user id representing the destination address, which is essentially a pusher channel subscribed by the client
 *   - request id - representing the request id at any given time
 *
 */ 4;

class AMQPConnection {
  private static instance: AMQPConnection;
  private _channel!: Channel;
  private eventEmitter = new events.EventEmitter();

  private constructor() {}

  public static getInstance(): AMQPConnection {
    if (!AMQPConnection.instance)
      AMQPConnection.instance = new AMQPConnection();
    return AMQPConnection.instance;
  }
  public async connectToRabbitMQ() {
    const { AMQP_HOST, AMQP_PORT } = process.env;
    console.log(
      `[info: connecting to rabbit mq] [host: ${AMQP_HOST}] [port: ${AMQP_PORT}]`
    );
    const conn = await amqp.connect(process.env.AMQP_HOST);
    this._channel = await conn.createChannel();
    await this._channel.assertExchange(queues.app_exchange, "direct");
    console.log("Connection to rabbitMQ has been established");
  }

  private async queueBuild() {
    await this._channel.assertQueue(constants.queues.incoming_messages, {
      durable: true,
    });
    await this._channel.assertQueue(constants.queues.update_messages, {
      durable: true,
    });
  }

  private async queueBinder() {
    await this._channel.bindQueue(
      constants.queues.incoming_messages,
      constants.queues.app_exchange,
      constants.keys.incoming_messages_key
    );
    await this._channel.bindQueue(
      constants.queues.update_messages,
      constants.queues.app_exchange,
      constants.keys.update_messages_key
    );
  }

  public get channel() {
    return this._channel;
  }
  public initializeQueueSystemBinderBuilder() {
    this.queueBuild();
    this.queueBinder();
  }
}

export { AMQPConnection };
