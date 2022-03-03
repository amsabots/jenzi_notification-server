import dotenv from "dotenv";
dotenv.config();
import { AMQPConnection } from "./config/rabbitmq";
import { RedisInstance } from "./config/redis-master";
import { PusherServer, ConsumeRabbitMessages } from "./consumers";
import express from "express";
import cors from "cors";

// pusher consume modules
import { startConsumption } from "./pusher-consumers";

//routes
import realtime_data_processor from "./routes/requests";
import { ChatRouter } from "./routes/chats";

const app = express();

// set express middleware
app.use(express.json());
app.use(cors());

const port = process.env.SERVER_PORT;

//
app.use("/realtime-server", realtime_data_processor);
app.use("/chats", ChatRouter);

// process.on("uncaughtException", (err) => {
//   console.log(
//     `[error: uncaught exception] [error name: ${err.name}] [actual error: ${err.message}]`
//   );
// });
process.on("unhandledRejection", (err) => {
  console.log(`[error: unhandled promise rejections] [error desc: ${err}]`);
});

(async () => {
  await AMQPConnection.getInstance().connectToRabbitMQ();
  AMQPConnection.getInstance().initializeQueueSystemBinderBuilder();
  // redis connection
  await RedisInstance.getInstance().connectToRedis();
  //consume rabbitMessages
  new ConsumeRabbitMessages().initiateQueueConsumption();
  //start consumption of pending requests - pusher
  PusherServer.getInstance().runSenderTask();
  // universal pusher consumer
  startConsumption();
})();

app.listen(port, () =>
  console.log(`Notification server receiving traffic on port ${port}`)
);
