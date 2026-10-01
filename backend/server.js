const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const api = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');
const { requireAuth } = require('./src/middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// The interactive demo and the video presentations (repo folder demo/), public -
// opened from the app header's Demo / Video Demo buttons. The recording tools
// in "video Presentations/tools" are not served.
const demoDir = path.join(__dirname, '..', 'demo');
app.use('/demo',
  (req, res, next) => (/\/tools(\/|$)/i.test(decodeURIComponent(req.path)) ? res.status(404).end() : next()),
  express.static(demoDir, { index: 'index.html', maxAge: '1h' }));

app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, api);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Key Artifact Generator running at http://localhost:${port}`);
});
