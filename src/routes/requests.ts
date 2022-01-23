import express from "express";
import random from "randomstring";
import { GenericNotificationFormat } from "../config/types";
import { AMQPConnection } from "../config/rabbitmq";
import { AppConstants } from "../config/env-var";

const router = express.Router();

router.post("/handle-service-request", (req, res) => {
  const body: GenericNotificationFormat = req.body;
  const requestId = random.generate({ charset: "hex" });
  body.requestId = requestId;
  // post to rabbit MQ
  AMQPConnection.getInstance().sendToQueue(
    JSON.stringify(body),
    AppConstants.queues.data_in,
    AppConstants.routing_keys.data_key
  );
  res.send({ requestId });
});

export default router;
