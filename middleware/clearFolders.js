// middleware/clearFolders.js
const fs = require('fs');
const path = require('path');

const clearFolder = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }
};

module.exports = (req, res, next) => {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  const processedDir = path.join(__dirname, '..', 'processed');
  clearFolder(uploadDir);
  clearFolder(processedDir);
  next();
};
