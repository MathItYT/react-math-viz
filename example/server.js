const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
const libDir = path.join(__dirname, '..', 'dist');

app.use('/lib', express.static(libDir));
app.use(express.static(publicDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Example server listening on http://localhost:${PORT}`);
});
