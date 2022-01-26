import IORedis from "ioredis";
import { GenericNotificationFormat } from ".";

class RedisInstance {
  private static instance: RedisInstance;
  private constructor() {}

  public static getInstance(): RedisInstance {
    if (null == this.instance) RedisInstance.instance = new RedisInstance();
    return RedisInstance.instance;
  }
  public connectToRedis(): IORedis.Redis {
    const redis = new IORedis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
    redis.on("connect", () => {
      console.log("connection to the redis server initiated");
    });
    return redis;
  }

  public async createNewRecord(
    key: string,
    record: GenericNotificationFormat,
    pattern: string
  ) {
    await this.connectToRedis().hmset(
      this.create_key(pattern, key),
      <never>record
    );
    console.log(`new entry object created against key ${key}`);
  }

  public async getStoreEntries(pattern: string, key = "") {
    const entries: GenericNotificationFormat[] = [];
    if (!key) {
      this.connectToRedis().keys(pattern, (err, keys) => {
        if (err) throw err;
        keys.forEach((element) => {
          const u = this.connectToRedis().hgetall(
            element
          ) as GenericNotificationFormat;
          entries.push(u);
        });
      });
    } else {
      const u = this.connectToRedis().hgetall(
        this.create_key(pattern, key)
      ) as GenericNotificationFormat;
      entries.push(u);
    }
    return entries.length ? entries : [];
  }

  public async updateExistingRecord(
    key: string,
    data: GenericNotificationFormat,
    pattern: string
  ) {
    const label = this.create_key(pattern, key);
    const c = await this.getStoreEntries(key, pattern);
    await this.connectToRedis().hmset(label, <never>{
      ...c,
      ...data,
    });
  }
  public async removeEntry(key: string, pattern: string) {
    const state = await this.connectToRedis().del(
      this.create_key(pattern, key)
    );
    if (state !== 1) throw "Deletion operation failed";
  }

  private create_key(pattern: string, key: string) {
    return `${pattern}:${key}`;
  }
}

export { RedisInstance };