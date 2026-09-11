const express = require('express');
const cors = require('cors');
require('dotenv').config();

const api = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');
const { requireAuth } = require('./src/middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, api);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Key Artifact Generator running at http://localhost:${port}`);
});
