declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AMQP_HOST: string;
      AMQP_PORT: number;
      AMQP_USER: string;
      AMQP_PASSWORD: string;
      PUSHER_ID: string;
      PUSHER_KEY: string;
      PUSHER_SECRET: string;
      PUSHER_CLUSTER: string;
      SERVER_PORT: number;
    }
  }
}
const AppConstants = {
  data_exchange: "DATA_EXCHANGE",
  queues: {
    data_in: "DATA_SERVER_IN",
    data_out: "DATA_SERVER_OUT",
    notification_in: "NOTIFICATION_IN",
    notification_out: "NOTIFICATION_OUT",
  },
  routing_keys: {
    data_key: "DATA_SERVER_KEY",
  },
};

export { AppConstants };
