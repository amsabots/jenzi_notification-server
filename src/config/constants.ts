export const redis_pattern = {
  requests: "jenzi:requests",
  chats: "jenzi:chats",
  chats_dlr: "jenzi:dlr",
  new_project: "jenzi:projects",
};

export const queues = {
  incoming_messages: "CHATS_QUEUE",
  update_messages: "CHATS_UPDATED_QUEUE",
  app_exchange: "JENZI_EXCHANGE",
  dlr_reports: "DLR_MESSAGE_QUEUE",
  remove_dlr: "REMOVE_DLR_QUEUE",
};

export const keys = {
  incoming_messages_key: "CHATS_QUEUE_KEY",
  update_messages_key: "CHATS_UPDATED_QUEUE_KEY",
};

