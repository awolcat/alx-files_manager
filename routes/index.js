import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const express = require('express');

const router = express.Router();


router.get('/status', (req, res) => {
  AppController.prototype.getStatus(req, res);
});

router.get('/stats', async (req, res) => {
  await AppController.prototype.getStats(req, res);
});

router.post('/users', async (req, res) => {
  await UsersController.prototype.postNew(req, res);
});

router.get('/connect', async (req, res) => {
  await AuthController.prototype.getConnect(req, res);
});

router.get('/disconnect', async (req, res) => {
  await AuthController.prototype.getDisconnect(req, res);
});

router.get('/users/me', async (req, res) => {
  await UsersController.prototype.getMe(req, res);
});

export default router;
