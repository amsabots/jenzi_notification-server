import { ConsumeRabbitMessages } from "./incoming-chats";
import { PusherServer } from "./pusher-sender";
import { PusherForChats } from "./pusher-chats-sender";

const pusher_filters = {
  request_user: "request_user",
  request_user_timedout: "requesting_fundi_timedout",
  user_accepted: "user_accepted",
  project_created: "new_project",
  accept_response_timedout: "accept_response_timedout",
  general_payload: "general_channel",
};

export { PusherServer, ConsumeRabbitMessages, PusherForChats, pusher_filters };
