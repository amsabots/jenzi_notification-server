declare global {
  namespace NodeJS {
    interface ProcessEnv {
      amqHost: string;
      amqPort: number;
    }
  }
}
const AppConstants = {
  Data_Exchange: "DATA_EXCHANGE",
  Topics: {
    data_in: "NOTIFICATION_SERVER_IN",
    data_out: "NOTIFICATION_SERVER_OUT",
  },
};

export { AppConstants };
