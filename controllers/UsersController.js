import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');

export default class UsersController {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.statusCode = 400;
      res.send({ error: 'Missing email' });
    } else if (!password) {
      res.statusCode = 400;
      res.send({ error: 'Missing password' });
    } else if (await dbClient.db.collection('users').findOne({ email })) {
      res.statusCode = 400;
      res.send({ error: 'Already exist' });
    } else {
      const passwordSha = sha1(password);
      const users = await dbClient.db.collection('users');
      const newUser = await users.insertOne(
        { email, passwordSha },
      );
      res.statusCode = 201;
      res.send(
        {
          id: newUser.insertedId,
          email,
        },
      );
    }
  }

  async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    } else {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ _id: ObjectId(userId) });
      res.statusCode = 200;
      res.send({ email: user.email, id: ObjectId(userId) });
    }
  }
}
