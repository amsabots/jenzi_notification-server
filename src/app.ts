import dotenv from "dotenv";
dotenv.config();
import { AMQPConnection } from "./config/rabbitmq";
import { PusherServer } from "./consumers/pusher-sender";
import express from "express";
import { AppConstants } from "./config/env-var";

//routes
import realtime_data_processor from "./routes/requests";

const app = express();

// set express middleware
app.use(express.json());

const port = process.env.SERVER_PORT;

//
app.use("/realtime", realtime_data_processor);

(async () => {
  await AMQPConnection.getInstance().connectToRabbitMQ();
  await PusherServer.getInstance().consumeDataPayload();
})();

app.listen(port, () => `Notification server receiving traffic on port ${port}`);
