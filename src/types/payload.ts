export interface RequestPayload {
  user?: { clientId?: string; name?: String };
  destination?: { accountId?: string; name?: String };
  payload?: {};
  ttl?: number;
  status?:
    | "JOBREQUEST"
    | "REQUESTDECLINED"
    | " REQUESTACCEPTED"
    | "PROJECTCREATED"
    | "PROJECTTIMEOUT";
  requestId?: string;
}
