import { ObjectId } from 'mongodb';
import { promises as fsPromise } from 'fs';
import dbClient from './utils/db';

const Queue = require('bull');
const fileQueue = new Queue('fileQueue');

const imageThumbnail = require('image-thumbnail');

fileQueue.process( async function (job) {
  if (!job.data.fileId) {
    return Promise.reject(new Error('Missing fileId'));
  }
  if (!job.data.userId) {
    return Promise.reject(new Error('Missing userId'));
  }
  //console.log('PROCESSOR!', job.data.name);
  const files = dbClient.db.collection('files');
  const file = await files.findOne({ _id: ObjectId(job.data.fileId), userId: job.data.userId });
  if (!file) {
    throw new Error('File not found');
  } else {
    job.progress(50);
    [500, 250, 100].forEach(async (size) => {
      const options = { width: size };
      const thumbnail = await imageThumbnail(job.data.localpath, options);
      const result = await fsPromise.writeFile(`${job.data.localpath}_${size}`, thumbnail) });
      return result;
    }
  });
