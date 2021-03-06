import dotenv from "dotenv";
dotenv.config();
import { AMQPConnection } from "./config/rabbitmq";
import { RedisInstance } from "./config/redis-master";
import express from "express";
import cors from "cors";

//routes
import { ChatRouter } from "./routes/chats";
import { RequestsRouter, house_keeper_checker } from "./routes/job-requests";
import { ConsumeRabbitMessages } from "./consumers";

const app = express();

// set express middleware
app.use(express.json());
app.use(cors());

const port = process.env.SERVER_PORT;

//
app.use("/chats", ChatRouter);
app.use("/jobs", RequestsRouter);

process.on("uncaughtException", (err) => {
  console.log(err);
});
process.on("unhandledRejection", (err) => {
  console.log(err);
});

(async () => {
  await AMQPConnection.getInstance().connectToRabbitMQ();
  await AMQPConnection.getInstance().initializeQueueSystemBinderBuilder();
  // redis connection
  await RedisInstance.getInstance().connectToRedis();
  //consume rabbitMessages
  new ConsumeRabbitMessages().initiateQueueConsumption();

  //initiate job scheduler consumer and clean up function
  house_keeper_checker();
})();

app.listen(port, () =>
  console.log(`Notification server receiving traffic on port ${port}`)
);
