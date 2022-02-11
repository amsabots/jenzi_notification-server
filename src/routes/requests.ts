import express from "express";
import random from "randomstring";
import { constants, GenericNotificationFormat, RedisInstance } from "../config";

const router = express.Router();

/**
 *
 * ================= SERVER INTERNAL WORKING ===========
 * - Multicast and unicast destination addressing not supported.
 * - Relies on websocket implementation with channel subscription wit events capability
 *
 */

//create notification on the fly
router.post("/notify", async (req, res) => {
  const body: GenericNotificationFormat = req.body;
  console.log(body);
  body.retryLimit = 0;
  const requestId = random.generate({ charset: "hex" });
  body.requestId = requestId;
  // post to redis
  await RedisInstance.getInstance().createNewRecord(
    requestId,
    body,
    constants.redis_pattern.requests
  );
  res.send({ requestId });
});

//get user notification - filter by sourceAddress; in this client app Id
router.get("/notify/:id", async (req, res) => {
  const { id } = req.params;
  const d = await RedisInstance.getInstance().getStoreEntries(
    constants.redis_pattern.requests
  );
  res.send(d.filter((e) => e.sourceAddress === id));
});

//delete notification - remove from redis and return
router.delete("/notify/:requestId", async (req, res) => {
  const { requestId } = req.params;
  await RedisInstance.getInstance().removeEntry(
    requestId,
    constants.redis_pattern.requests
  );
  res.send({ message: "Deletion complete" });
});

export default router;
