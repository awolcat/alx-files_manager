import { createClient } from 'redis';
import { promisify } from 'util';
const util = require('util');


class RedisClient {
  constructor() {
    this.client = createClient()
        .on('error', (error) => {
          console.log(error.message);
        });
  }

  isAlive() {
    const alAsync = promisify(this.client.PING).bind(this.client);
    return (async () => { return await alAsync('PONG') === 'PONG' })();
  }

  async get(key) {
    const getAsync = promisify(this.client.GET).bind(this.client);
    const value = await getAsync(key);
    return value;
  }

  async set(key, value, delay) {
    const setAsync = promisify(this.client.SET).bind(this.client);
    await setAsync(key, value, 'EX', delay);
  }

  async del(key) {
    const delAsync = promisify(this.client.DEL).bind(this.client);
    await delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
