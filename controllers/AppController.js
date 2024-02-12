import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const express = require('express');

export function getStatus(request, response) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    response.statusCode = 200;
    response.send({ 'redis': redis, 'db': db });
  }
