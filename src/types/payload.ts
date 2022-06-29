export interface RequestPayload {
  user?: { clientId?: string; name?: String };
  destination?: { account_id?: string; name?: String };
  payload?: {};
  ttl?: number;
  status?:
    | "JOBREQUEST"
    | "REQUESTDECLINED"
    | "REQUESTACCEPTED"
    | "PROJECTCREATED"
    | "PROJECTTIMEOUT";
  requestId?: string;
  createdAt?: number;
}
