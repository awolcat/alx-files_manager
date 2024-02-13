import sha1 from 'sha1';
import { v4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {

  async getConnect(req, res) {
    const auth_string = req.header('Authorization');
    const [type, basicAuthToken] = auth_string.split(' ');

    if ( !basicAuthToken ) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }

    const decodedCredentials = Buffer.from(basicAuthToken, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    if ( !email || !password ) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' })
    }

    const user = await dbClient.db.collection('users').findOne({ email: email, password: sha1(password) });

    if ( !user ) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    } else {
      const token = v4();  //v4 from uuid
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 3600 * 24);
      res.statusCode = 200;
      res.send({ token: token });
    }
  }

  async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const users = dbClient.db.collection('users')
    const user = await users.findOne({ _id: ObjectId(userId) });
    if ( !user ) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    } else {
      await redisClient.del(key);
      res.statusCode = 204;
      res.send({});
    }
  }
}
