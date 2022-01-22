/* eslint-disable no-empty */
import amqp from "amqplib";

class AMQPConnection {
  private static instance: AMQPConnection;

  private constructor() {
    const connection = amqp.connect(process.env.amqHost);
  }
}
