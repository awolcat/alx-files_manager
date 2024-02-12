import { getStatus, getStats } from '../controllers/AppController';

const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  getStatus(req, res);
});

router.get('/stats', async (req, res) => {
  await getStats(req, res);
});

export default router;
