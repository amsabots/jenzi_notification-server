export interface RequestPayload {
  user?: { client_id?: string; name?: String };
  destination?: { account_id?: string; name?: String };
  payload?: {};
  ttl?: number;
  //prettier-ignore
  status?:| "JOBREQUEST"| "REQUESTDECLINED"| "REQUESTACCEPTED"|"PROJECTTIMEOUT"|"ACK"
  requestId?: string;
  createdAt?: number;
}
