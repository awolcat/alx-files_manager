import { getStatus } from '../controllers/AppController';

const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  getStatus(req, res);
});

export default router;
