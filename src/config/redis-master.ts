import IORedis from "ioredis";
import { GenericNotificationFormat } from ".";

class RedisInstance {
  private static instance: RedisInstance;
  private _redis!: IORedis.Redis;
  private constructor() {}

  public get redis() {
    return this._redis;
  }

  public static getInstance(): RedisInstance {
    if (null == this.instance) RedisInstance.instance = new RedisInstance();
    return RedisInstance.instance;
  }
  public connectToRedis() {
    return new Promise((res) => {
      this._redis = new IORedis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      });
      this._redis.on("connect", () => {
        console.log("connection to the redis server initiated");
        res("done");
      });
    });
  }

  public async createNewRecord(
    key: string,
    record: GenericNotificationFormat,
    pattern: string
  ) {
    await this._redis.set(
      this.create_key(pattern, key),
      JSON.stringify(record)
    );
    console.log(
      `new entry object created against key ${this.create_key(pattern, key)}`
    );
  }

  public getStoreEntries(
    pattern: string
  ): Promise<GenericNotificationFormat[]> {
    return new Promise((res, error) => {
      this._redis.keys(pattern + ":*", async (err, keys) => {
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
    return new Promise((res, rej) => {
      const r_key = pattern ? this.create_key(pattern, key) : key;
      this._redis.get(r_key, (err, data) => {
        if (err) return rej(err);
        res(JSON.parse(<any>data));
      });
    });
  }

  public async removeEntry(key: string, pattern: string) {
    const state = await this._redis.del(this.create_key(pattern, key));
    if (state !== 1) throw "Deletion operation failed";
  }

  public create_key(pattern: string, key: string) {
    return `${pattern}:${key}`;
  }
}

export { RedisInstance };
