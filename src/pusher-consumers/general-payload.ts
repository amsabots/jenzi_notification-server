import { PusherServer, pusher_filters } from "../consumers";
import { RedisInstance } from "../config";
import { redis_pattern } from "../config/constants";
import cron from "node-cron";

const pusher = PusherServer.getInstance();
const redis = RedisInstance.getInstance();

const consume_general_payload = async () => {
  const accepted = await redis.getStoreEntries(redis_pattern.requests);
  accepted.forEach(async (element) => {
    if (element.filterType !== pusher_filters.general_payload) return;
    const {
      destinationAddress,
      filterType,
      requestId,
      retryLimit,
      sourceAddress,
    } = element;

    if (Number(retryLimit) > 4) {
      await redis.removeEntry(requestId!, redis_pattern.requests);
      return await pusher.pusher.trigger(
        sourceAddress!,
        pusher_filters.accept_response_timedout,
        element
      );
    }

    element.retryLimit = Number(retryLimit) + 1;
    await redis.updateExistingRecord(
      requestId!,
      element,
      redis_pattern.requests
    );
    console.log(
      `[info: sending some genral classified data to user] [destination: ${destinationAddress}]`
    );
    return await pusher.pusher.trigger(
      destinationAddress!,
      filterType,
      element
    );
  });
};

export const consumeGeneralPayload = () => {
  console.log(
    `Scheduler for consuming general classified payload has been initialized.............`
  );
  cron.schedule("*/10 * * * * *", async () => {
    await consume_general_payload();
  });
};
