import { AMQPConnection } from "../config/rabbitmq";
import { AppConstants } from "../config/env-var";
import Pusher from "pusher";
import { GenericNotificationFormat } from "../config/types";

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

  public async consumeDataPayload() {
    const channel = await AMQPConnection.getInstance().createTopicExchangeQueue(
      AppConstants.queues.data_in,
      AppConstants.routing_keys.data_key,
      AppConstants.data_exchange
    );
    channel.consume(AppConstants.queues.data_in, async (data) => {
      const payload = <any>data?.content.toString();
      const o = <GenericNotificationFormat>JSON.parse(payload);
      await this.pusherClient.trigger(
        <string>o.destinationAddress,
        <string>o.filterType,
        o
      );
      console.log(
        `[info: realtime data sent] [destination address: ${o.destinationAddress}] [filter type: ${o.filterType}] [requestId: ${o.requestId}]`
      );
      channel.ack(<any>data);
    });
  }
}

export { PusherServer };
