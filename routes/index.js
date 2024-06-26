import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

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

router.post('/files', async (req, res) => {
  await FilesController.prototype.postUpload(req, res);
});

router.get('/files/', async (req, res) => {
  await FilesController.prototype.getIndex(req, res);
});

router.get('/files/:id', async (req, res) => {
  await FilesController.prototype.getShow(req, res);
});

router.put('/files/:id/publish', async (req, res) => {
  await FilesController.prototype.putPublish(req, res);
});

router.put('/files/:id/unpublish', async (req, res) => {
  await FilesController.prototype.putUnpublish(req, res);
});

router.get('/files/:id/data', async (req, res) => {
  await FilesController.prototype.getFile(req, res);
});

export default router;
