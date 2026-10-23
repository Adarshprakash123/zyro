require('dotenv').config();
const mongoose = require('mongoose');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zuryo';

async function main() {
  await mongoose.connect(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Zuryo API listening on :${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
