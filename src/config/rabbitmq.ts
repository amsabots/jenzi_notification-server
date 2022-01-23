/* eslint-disable no-empty */
import amqp, { Channel } from "amqplib";
import { AppConstants as constants } from "./env-var";
import Pusher from "pusher";
import events from "events";

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
  private channel!: Channel;
  private eventEmitter = new events.EventEmitter();

  private constructor() {}

  public static getInstance(): AMQPConnection {
    if (!AMQPConnection.instance)
      AMQPConnection.instance = new AMQPConnection();
    return AMQPConnection.instance;
  }
  public async connectToRabbitMQ() {
    const conn = await amqp.connect(process.env.AMQP_HOST);
    this.channel = await conn.createChannel();
    console.log("Connection to rabbitMQ has been established");
  }

  public async createTopicExchangeQueue(
    queue: string,
    routing_key: string,
    exchange: string
  ) {
    await this.channel.assertExchange(exchange, "topic");
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.bindQueue(queue, exchange, routing_key);
    return this.channel;
  }

  public async sendToQueue(
    payload: any,
    queue: string,
    routing_key: string,
    exchange = constants.data_exchange
  ) {
    const c = await this.createTopicExchangeQueue(queue, routing_key, exchange);
    if (c) c.sendToQueue(queue, Buffer.from(payload));
  }
}

export { AMQPConnection };
