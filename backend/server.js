const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const api = require('./src/routes/api');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api', api);

// serve the frontend
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir, { index: false }));
app.get('/', (req, res) => res.sendFile(path.join(frontendDir, 'modern', 'index.html')));
app.get('/excel', (req, res) => res.sendFile(path.join(frontendDir, 'excel.html')));
app.get('/webapp', (req, res) => res.sendFile(path.join(frontendDir, 'webapp', 'index.html')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Key Artifact Generator running at http://localhost:${port}`);
});
