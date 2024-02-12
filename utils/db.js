const { MongoClient } = require('mongodb');

const HOST = process.env['DB_HOST'] || 'localhost';
const PORT = process.env['DB_HOST'] || 27017;
const DBNAME = process.env['DB_DATABASE'] || 'files_manager';
const URL = `mongodb://${HOST}:${PORT}`;

class DBClient {

  constructor() {
    this.client = new MongoClient(URL, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if ( !err ) {
        this.db = this.client.db(DBNAME);
      } else {
	this.db = false;
      }
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    return await this.db.collection('users')
      .countDocuments({}, { hint: '_id_' });
  }

  async nbFiles() {
    return await this.db.collection('files')
      .countDocuments({}, { hint: '_id_' });
  }
}

const dbClient = new DBClient();
export default dbClient;
