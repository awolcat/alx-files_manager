import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log('Could not connect to redis server:', error.toString());
    });
    this.connected = true;
  }

  isAlive() {
    return this.connected || false;
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
