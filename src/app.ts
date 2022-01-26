import dotenv from "dotenv";
dotenv.config();
import { AMQPConnection } from "./config/rabbitmq";
import { RedisInstance } from "./config/redis-master";
import { PusherServer } from "./consumers/pusher-sender";
import express from "express";

//routes
import realtime_data_processor from "./routes/requests";

const app = express();

// set express middleware
app.use(express.json());

const port = process.env.SERVER_PORT;

//
app.use("/realtime", realtime_data_processor);

process.on("uncaughtException", (err) => {
  console.log(
    `[error: uncaught exception] [error name: ${err.name}] [actual error: ${err.message}]`
  );
});

const delay = () => {
  return new Promise((res) => setTimeout(res, 5000));
};

process.on("unhandledRejection", (err) => {
  console.log(`[error: unhandled promise rejections] [error desc: ${err}]`);
});
(async () => {
  await AMQPConnection.getInstance().connectToRabbitMQ();
  // redis connection
  RedisInstance.getInstance().connectToRedis();
})();

app.listen(port, () => `Notification server receiving traffic on port ${port}`);
