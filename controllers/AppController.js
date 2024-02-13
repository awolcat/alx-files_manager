import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const express = require('express');

export default class AppController {

  getStatus(request, response) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    response.statusCode = 200;
    response.send({ 'redis': redis, 'db': db });
  }

  async getStats(request, response) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    response.send({ 'users': users, 'files': files });
  }
}
