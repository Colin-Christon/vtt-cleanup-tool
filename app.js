// app.js
const express = require('express');
const path = require('path');
const uploadRoutes = require('./routes/upload');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/', uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
