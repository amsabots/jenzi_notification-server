import express from "express";
import { RequestPayload } from "../types";
import path from "path";
import { firebase_db } from "../config/firebase";
import { ref, set, update, remove, get } from "firebase/database";
import { constants, RedisInstance } from "../config";
import Randomstring from "randomstring";
import cron from "node-cron";

// create a redis instance
const redis = RedisInstance.getInstance();
const ttl = 1000 * 60;
const expireAfter = 120;

const router = express.Router();
const logger = console.log.bind(
  console,
  `[file: ${path.basename(__filename)}] `
);

const create_firebase_entry = (userId: string, payload: RequestPayload) => {
  const path = ref(firebase_db, `jobalerts/${userId}`);
  return new Promise((res, rej) => {
    set(path, <RequestPayload>{
      requestId: payload.requestId,
      event: payload.status,
      createdAt: new Date().getTime(),
      user: payload.user,
    })
      .then((re) => res(re))
      .catch((e) => rej(e));
  });
};
const update_project_entry = async (userId: string, payload: {}) => {
  const path = ref(firebase_db, `jobalerts/${userId}`);
  await update(path, payload);
};

const get_object_payload = async (
  requestId: string
): Promise<RequestPayload> => {
  const d: any = await redis.redis.get(project_key(requestId));
  return <RequestPayload>JSON.parse(d);
};

const remove_firebase_entry = (userId: string) => {
  return new Promise((res, rej) => {
    remove(ref(firebase_db, `jobalerts/${userId}`))
      .then((re) => res(re))
      .catch((e) => rej(e));
  });
};

const set_data_to_redis = async (key: string, data: {}) => {
  await redis.redis.set(
    project_key(key),
    JSON.stringify(<never>data),
    "EX",
    expireAfter
  );
};

const project_key = (key: string) => {
  return `${constants.redis_pattern.new_project}:${key}`;
};

router
  .post("/requests", async (req, res) => {
    const body: Partial<RequestPayload> = req.body;
    body.ttl = new Date().getTime() + ttl;
    const requestId = Randomstring.generate({ charset: "hex" });
    body.requestId = requestId;
    // create a new entry inside redis
    await set_data_to_redis(requestId, body);
    //send alert of job creation to redis
    await create_firebase_entry(body.destination?.account_id!, {
      status: "JOBREQUEST",
      requestId,
      user: body.user,
    });
    logger(
      `[info: new job request created] [user: ${body.user?.client_id}] [destination: ${body.destination?.account_id}]`
    );
    res.json({ requestId });
  })
  .get("/requests/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const d = await get_object_payload(requestId);
    return res.send(d);
  })
  .put("/requests/:requestId", async (req, res) => {
    //update object should have status
    const body = req.body;
    const id = req.params.requestId;
    // get the actual object from redis
    const data = await get_object_payload(id);
    //update the new object in redis
    await set_data_to_redis(
      id,
      Object.assign({ ...data, status: body.status })
    );

    data.status = body.status;
    res.send(data);
  })
  .delete("/requests/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const d = await get_object_payload(requestId);
    await remove_firebase_entry(d.destination?.account_id!);
    await redis.redis.del(project_key(requestId));
    res.json({ requestId, message: "removed" });
  });

const house_keeper_checker = () => {
  cron.schedule("*/20 * * * * *", async () => {
    redis.redis.keys(constants.redis_pattern.new_project + ":*", (err, key) => {
      key.forEach(async (element) => {
        let d: any = await redis.redis.get(element);
        const data = <RequestPayload>JSON.parse(d);
        //prettier-ignore
        const query = ref(firebase_db, `jobalerts/${data.destination?.account_id!}`)
        const firebase_record = await get(query);
        if (!firebase_record.exists()) return;
        //send a request timeout request
        if (data.ttl! < new Date().getTime()) {
          switch (data.status!) {
            case "JOBREQUEST":
              logger(
                `[info: job request timeout] [jobId: ${data.requestId}] [client: ${data.user?.client_id}] [fundi: ${data.destination?.account_id}]`
              );
              await update_project_entry(data.destination?.account_id!, {
                event: "PROJECTTIMEOUT",
              });
              //update redis record
              await redis.redis.del(project_key(data.requestId!));
              break;
            case "PROJECTTIMEOUT":
              await remove_firebase_entry(data.destination?.account_id!);
              break;
            case "REQUESTACCEPTED":
            case "REQUESTDECLINED":
            case "PROJECTCREATED":
              const new_ttl = data.ttl! + 30000;
              if (new_ttl < new Date().getTime()) {
                await remove_firebase_entry(data.destination?.account_id!);
                await redis.redis.del(project_key(data.requestId!));
              }
              break;
            default:
              break;
          }
        }
      });
    });
  });
};

export { router as RequestsRouter, house_keeper_checker };
