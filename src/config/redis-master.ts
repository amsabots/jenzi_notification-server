import IORedis from "ioredis";
import { GenericNotificationFormat } from ".";

class RedisInstance {
  private static instance: RedisInstance;
  private redis!: IORedis.Redis;
  private constructor() {}

  public static getInstance(): RedisInstance {
    if (null == this.instance) RedisInstance.instance = new RedisInstance();
    return RedisInstance.instance;
  }
  public connectToRedis() {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
    this.redis.on("connect", () => {
      console.log("connection to the redis server initiated");
    });
  }

  public async createNewRecord(
    key: string,
    record: GenericNotificationFormat,
    pattern: string
  ) {
    await this.redis.hmset(this.create_key(pattern, key), <never>record);
    console.log(
      `new entry object created against key ${this.create_key(pattern, key)}`
    );
  }

  public getStoreEntries(
    pattern: string
  ): Promise<GenericNotificationFormat[]> {
    const entries: GenericNotificationFormat[] = [];
    return new Promise(async (res, error) => {
      this.redis.keys(pattern + ":*", async (err, keys) => {
        if (err) error(err);
        const p: Array<Promise<GenericNotificationFormat>> = [];
        keys.forEach(async (k) => {
          p.push(this.getSingleEntryRecord(k));
        });
        const results = await Promise.all(p);
        res(results);
      });
    });
  }

  public getSingleEntryRecord(
    key: string,
    pattern = ""
  ): Promise<GenericNotificationFormat> {
    return new Promise((res, err) => {
      const r_key = pattern ? this.create_key(pattern, key) : key;
      this.redis.hgetall(r_key, (e, data) => {
        if (e) err(e);
        res(data);
      });
    });
  }

  public async updateExistingRecord(
    key: string,
    data: GenericNotificationFormat,
    pattern: string
  ) {
    const label = this.create_key(pattern, key);
    const c = await this.getSingleEntryRecord(key, pattern);
    await this.redis.hmset(label, <never>{
      ...c,
      ...data,
    });
  }
  public async removeEntry(key: string, pattern: string) {
    const state = await this.redis.del(this.create_key(pattern, key));
    if (state !== 1) throw "Deletion operation failed";
  }

  private create_key(pattern: string, key: string) {
    return `${pattern}:${key}`;
  }
}

export { RedisInstance };
