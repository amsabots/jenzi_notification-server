import { PusherServer, pusher_filters } from "../consumers";
import { RedisInstance } from "../config";
import { redis_pattern } from "../config/constants";
import cron from "node-cron";

const pusher = PusherServer.getInstance();
const redis = RedisInstance.getInstance();

const consume_user_accepted = async () => {
  const accepted = await redis.getStoreEntries(redis_pattern.requests);
  accepted.forEach(async (element) => {
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
    return await pusher.pusher.trigger(
      sourceAddress!,
      pusher_filters.accept_response_timedout,
      element
    );
  });
};

export const consumeResponseToRequests = () => {
  cron.schedule("*/7 * * * * *", async () => {
    await consume_user_accepted();
  });
};
