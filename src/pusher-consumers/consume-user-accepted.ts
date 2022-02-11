import { PusherServer, pusher_filters } from "../consumers";
import { RedisInstance } from "../config";
import { redis_pattern } from "../config/constants";
import cron from "node-cron";

const pusher = PusherServer.getInstance();
const redis = RedisInstance.getInstance();

const consume_user_accepted = async () => {
  const accepted = await redis.getStoreEntries(redis_pattern.requests);
  accepted.forEach(async (element) => {
    console.log(element);
    if (element.filterType !== pusher_filters.user_accepted) return;
    const {
      destinationAddress,
      filterType,
      requestId,
      retryLimit,
      sourceAddress,
    } = element;

    if (Number(retryLimit) > 2) {
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
      `[info: sending user accepted response to client] [destination: ${destinationAddress}]`
    );
    return await pusher.pusher.trigger(
      destinationAddress!,
      filterType,
      element
    );
  });
};

export const consumeResponseToRequests = () => {
  console.log(
    `Scheduler for consuming incoming responses to sent requests has been initialized.............`
  );
  cron.schedule("*/5 * * * * *", async () => {
    await consume_user_accepted();
  });
};
