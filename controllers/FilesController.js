import { promises as fileSystemPromise } from 'fs';
import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {

  async postUpload(req, res) {
    const userToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const {name, type, parentId = 0, isPublic = false, data = ''} = req.body;
    allowedTypes = ['folder', 'file', 'image'];
    if (!name) {
      res.statusCode = 400;
      res.send({ error: 'Missing name' });
    }
    if (!type || !(type in allowedTypes)) {
      res.statusCode = 400;
      res.send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      res.statusCode = 400;
      res.send({ error: 'Missing data' });
    }
    const filesCollection = dbClient.db.collection('files');
    if (parentId !== 0) {
      // A parentId other than the root upload folder
      const parentFolder = await filesCollection.findOne({ _id: ObjectId(parentId) });
      if (!parentFolder) {
        res.statusCode = 400;
        res.send({ error: 'Parent not found' });
      }
      if (parentFolder.type !== 'folder') {
        res.statusCode = 400;
	console.log('TYPE', parentFolder.type);
        res.send({ error: 'Parent is not a folder' });
      }
      if (parentFolder.type === 'folder') {
        const folderPath = parentFolder.localpath;
	const filePath = `${folderPath}/${name}`;
	const decodedData = Buffer.from(data, 'base64');
	await fileSystemPromise.mkdir(folderPath, { recursive: true });
	if (type !== 'folder') {
          await fileSystemPromise.writeFile(filePath, decodedData);
	} else {
	  await fileSystemPromise.mkdir(filePath);
	}
	const newUpload = await filesCollection.insertOne({
	  userId,
	  name,
	  type,
	  isPublic,
	  parentId,
	  localpath: filePath,
	});

        res.statusCode = 201;
        res.send({
          id: newUpload.insertedId,
	  userId,
	  name,
	  type,
	  isPublic,
	  parentId,
	});
      }
    } else {
      const folder = process.env.FOLDER_PATH || '/tmp/files_manager';
      const file = v4();
      const filePath = `${folder}/${file}`;
      const decodedData = Buffer.from(data, 'base64');

      await fileSystemPromise.mkdir(folder, { recursive: true });
      if (type !== 'folder') {
        await fileSystemPromise.writeFile(filePath, decodedData);
      } else {
        await fileSystemPromise.mkdir(filePath);
      }

      const newUpload = await filesCollection.insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId: 0,
        localpath: filePath,
      });

      res.statusCode = 201;
      res.send({
        id: newUpload.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }
  }
}
