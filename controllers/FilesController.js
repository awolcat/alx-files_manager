import { promises as fileSystemPromise } from 'fs';
import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const Queue = require('bull');
const mime = require('mime-types');

const fileQueue = new Queue('fileQueue');
fileQueue.on('completed', function (job, result) {
  console.log(`Job ${job.name} completed`);
});

fileQueue.on('failed', function (job, err) {
  console.log(`Job ${job.name} failed with error: ${err}`)
});

fileQueue.on('progress', function (job, progress) {
  console.log(`Job ${job.name} ${progress} done`);
});

fileQueue.on('active', function (job, jobPromise) {
  console.log(`${job.name} ACTIVE`);
});

export default class FilesController {

  async postUpload(req, res) {
    const userToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const {name, type, parentId = 0, isPublic = false, data = ''} = req.body;
    const allowedTypes = ['folder', 'file', 'image'];
    if (!name) {
      res.statusCode = 400;
      res.send({ error: 'Missing name' });
    }
    if (!type || !allowedTypes.includes(type)) {
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
        res.send({ error: 'Parent is not a folder' });
      }
      if (parentFolder.type === 'folder') {
        const folderPath = parentFolder.localpath;
	const fileName = v4();
	const filePath = `${folderPath}/${fileName}`;
	const decodedData = Buffer.from(data, 'base64');
	await fileSystemPromise.mkdir(folderPath, { recursive: true });
	if (type !== 'folder') {
          await fileSystemPromise.writeFile(filePath, decodedData);
	} else {
	  await fileSystemPromise.mkdir(filePath);
	}
        const nuFile = {
          userId: userId,
          name: name,
          type: type,
          isPublic: isPublic,
          parentId: parentId,
          localpath: filePath,
	};
	const newUpload = await filesCollection.insertOne(nuFile);
	nuFile['fileId'] = newUpload.insertedId;
        await fileQueue.add(nuFile);

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

      const nuFile = {
          userId: userId,
          name: name,
          type: type,
          isPublic: isPublic,
          parentId: parentId,
          localpath: filePath,
        };
      const newUpload = await filesCollection.insertOne(nuFile);
      nuFile['fileId'] = newUpload.insertedId;
      fileQueue.add(nuFile);

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

  async getShow(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    const files = dbClient.db.collection('files');
    const file = await files.findOne({ _id: ObjectId(fileId) });
    
    if (!file) {
      res.statusCode = 404;
      res.send({ error: 'Not found' });
    } else {
      const { localpath, ...remaining } = file;
      res.send(remaining);
    }
  }

  async getIndex(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const { parentId = 0, page } = req.query;
    const filesCollection = dbClient.db.collection('files');
    const folderFiles = await filesCollection.find({ parentId: parentId })
      .project({ localpath: 0 });
    // Paginate
    const start = parseInt(page) * 20;
    const end = start + 19;
    const sortedFiles = await folderFiles.sort({ _id: 1 }).toArray();
    folderFiles.close();
    if (sortedFiles.length > 20) {
      const payload = [];
      let index = 0;
      while ( start < sortedFiles.length && start <= end ) {
        payload[index] = sortedFiles[start];
        start += 1;
        index += 1;
      }
      res.send(payload);
    } else {
      res.send(sortedFiles);
    }
  }
  
  async putPublish(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    const files = dbClient.db.collection('files');
    const result = await files
      .updateOne({ _id: ObjectId(fileId), userId: userId }, { $set: { isPublic: true } });
    if (result.matchedCount < 1) {
      res.statusCode = 404;
      res.send({ error: 'Not found' });
    } else {
      const file = await files.findOne({ _id: ObjectId(fileId), userId: userId });
      res.statusCode = 200;
      const { localpath, ...remaining } = file;
      res.send(remaining);
    }
  }

  async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.statusCode = 401;
      res.send({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    const files = dbClient.db.collection('files');
    const result = await files
      .updateOne({ _id: ObjectId(fileId), userId: userId }, { $set: { isPublic: false } });
    if (result.matchedCount < 1) {
      res.statusCode = 404;
      res.send({ error: 'Not found' });
    } else {
      const file = await files.findOne({ _id: ObjectId(fileId), userId: userId });
      res.statusCode = 200;
      const { localpath, ...remaining } = file;
      res.send(remaining);
    }
  }

  async getFile(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    const fileId = req.params.id;
    const collection = dbClient.db.collection('files');
    const file = await collection.findOne({ _id: ObjectId(fileId), userId: userId });
    if (!file || (!file.isPublic && !token)) {
      res.statusCode = 404;
      res.send({ error: 'Not found' });
    } else if (file.type === 'folder') {
      res.statusCode = 400;
      res.send({ error: "A folder doesn't have content" });
    } else {
      try {
        const contents = await fileSystemPromise.readFile(file.localpath);
	const type = mime.lookup(file.name);
	res.type(type);
        res.statusCode = 200;
	res.send(contents);
      } catch (error) {
	console.log(error);
        res.statusCode = 404;
        res.send({ error: 'Not found' });
      }
    }
  }
}
