import router from './routes/index';

const express = require('express');
const bodyParser = require('body-parser').urlencoded({ extended: false });

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(bodyParser);
app.use(router);

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

export default app;
