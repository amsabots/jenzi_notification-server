import dotenv from "dotenv";
dotenv.config();
import { AMQPConnection } from "./config/rabbitmq";
import { RedisInstance } from "./config/redis-master";
import { PusherServer, ConsumeRabbitMessages } from "./consumers";
import express from "express";
import cors from "cors";

//routes
import realtime_data_processor from "./routes/requests";

const app = express();

// set express middleware
app.use(express.json());
app.use(cors());

const port = process.env.SERVER_PORT;

//
app.use("/realtime-server", realtime_data_processor);

// process.on("uncaughtException", (err) => {
//   console.log(
//     `[error: uncaught exception] [error name: ${err.name}] [actual error: ${err.message}]`
//   );
// });
// process.on("unhandledRejection", (err) => {
//   console.log(`[error: unhandled promise rejections] [error desc: ${err}]`);
// });

const delay = () => {
  return new Promise((res) => setTimeout(res, 5000));
};

(async () => {
  await AMQPConnection.getInstance().connectToRabbitMQ();
  // redis connection
  RedisInstance.getInstance().connectToRedis();
  //consume rabbitMessages
  new ConsumeRabbitMessages().initiateQueueConsumption();
  //start consumption of pending requests - pusher
  await PusherServer.getInstance().consume_messages_of_type_requests();
})();

app.listen(port, () => `Notification server receiving traffic on port ${port}`);
