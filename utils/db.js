const { MongoClient } = require('mongodb');

class DBClient {
  #HOST;
  #PORT;
  #DB;
  #URL;
  constructor() {
    this.#HOST = process.env['DB_HOST'] || 'localhost';
    this.#PORT = process.env['DB_HOST'] || 27017;
    this.#DB = process.env['DB_DATABASE'] || 'files_manager';
    this.#URL = `mongodb://${this.#HOST}:${this.#PORT}`;
    this.client = new MongoClient(this.#URL, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if ( !err ) {
        this.db = this.client.db(this.#DB);
      } else {
	this.db = false;
        console.log('CONNECTION ERROR', err);
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
