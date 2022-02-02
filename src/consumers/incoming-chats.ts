import { AMQPConnection, constants } from "../config";

class ConsumeRabbitMessages {
  private rabbit = AMQPConnection.getInstance();
  constructor() {}
  private consumeIncomingMessages() {
    console.log(
      `Listening for messages on queue ${constants.queues.incoming_messages}`
    );
    this.rabbit.channel.consume(constants.queues.incoming_messages, (data) => {
      console.log(data?.content.toString());
      //insert object to redis
      /**
       *
       * {"createdAt":null,"updatedAt":null,"id":0,
       * "messageId":null,"message":"Hello sir","date_sent":null,"delivered":false,"sent":false,"sourceId":"andrewmwebi","destinationId":"lameckowesi"}
       */
      this.rabbit.channel.ack(data!);
    });
  }

  private consumeDLRReports() {
    console.log(
      `Listening for DLR messages on queue ${constants.queues.dlr_reports}`
    );
    this.rabbit.channel.consume(constants.queues.dlr_reports, (data) => {
      console.log(data?.content.toString());
      //remove the object from the dlr queue and create a dlr report and send it back to message owner
      /**
       *
       * {"createdAt":null,"updatedAt":null,"id":0,
       * "messageId":null,"message":"Hello sir","date_sent":null,"delivered":false,"sent":false,"sourceId":"andrewmwebi","destinationId":"lameckowesi"}
       */
      this.rabbit.channel.ack(data!);
    });
  }

  private consumeRemoveDLRReportTriggers() {
    console.log(
      `Listening for remove DLR messages on queue ${constants.queues.remove_dlr}`
    );
    this.rabbit.channel.consume(constants.queues.remove_dlr, (data) => {
      console.log(data?.content.toString());
      //remove remove dlr report
      /**
       *
       *
       */
      this.rabbit.channel.ack(data!);
    });
  }

  public initiateQueueConsumption() {
    this.consumeIncomingMessages();
    this.consumeDLRReports();
    this.consumeRemoveDLRReportTriggers();
  }
}

export { ConsumeRabbitMessages };
