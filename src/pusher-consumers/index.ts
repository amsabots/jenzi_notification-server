import { consumeResponseToRequests } from "./consume-user-accepted";
import { consumeGeneralPayload } from "./general-payload";

export const startConsumption = () => {
  consumeResponseToRequests();
  consumeGeneralPayload();
};
