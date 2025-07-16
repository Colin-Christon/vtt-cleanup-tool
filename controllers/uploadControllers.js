// controllers/uploadController.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

exports.handleMultipleUpload = (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const processedDir = path.join(__dirname, '..', 'processed');

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send('No files uploaded.');
    }

    const processedFiles = [];

    for (let file of files) {
      const content = fs.readFileSync(file.path, 'utf8');
      const lines = content.split('\n');
      const cleanedLines = [];

     for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Remove exact 00:00:00.000 --> 00:00:00.000 line
  if (line === '00:00:00.000 --> 00:00:00.000') {
    // Skip this line
    // But add the next line as separate line (text or timestamp)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();

      // Check if nextLine has timestamp + text in same line
      const timestampTextMatch = nextLine.match(/^(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})(.*)$/);
      if (timestampTextMatch) {
        // Push timestamp and text on separate lines
        cleanedLines.push(timestampTextMatch[1].trim()); // timestamp
        const textPart = timestampTextMatch[2].trim();
        if (textPart) cleanedLines.push(textPart); // text in next line
      } else {
        // Just push the next line as is
        cleanedLines.push(nextLine);
      }
      i++; // skip next line because we handled it
    }
    continue; // move to next iteration
  }

  // Remove '00:00:00:00' lines completely
  if (line === '00:00:00:00') {
    continue;
  }

  // For any timestamp + text on same line in other cases, split them
  const timestampTextMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})(.*)$/);
  if (timestampTextMatch) {
    cleanedLines.push(timestampTextMatch[1].trim()); // timestamp
    const textPart = timestampTextMatch[2].trim();
    if (textPart) cleanedLines.push(textPart); // text in next line
    continue;
  }

  // Default: push line as is
  cleanedLines.push(line);
}



      const cleanedContent = cleanedLines.join('\n');
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const newName = `${base.slice(0, -2)}EN${ext}`;
      const processedPath = path.join(processedDir, newName);

      fs.writeFileSync(processedPath, cleanedContent, 'utf8');
      processedFiles.push({ path: processedPath, name: newName });
    }

    // Create zip file
    const zipId = uuidv4();
    const zipName = `processed_${zipId}.zip`;
    const zipPath = path.join(processedDir, zipName);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, zipName, err => {
        if (!err) {
          // cleanup zip and processed files after download
          fs.unlink(zipPath, () => {});
          processedFiles.forEach(f => fs.unlink(f.path, () => {}));
        }
      });
    });

    archive.on('error', err => {
      console.error(err);
      res.status(500).send('Error creating zip');
    });

    archive.pipe(output);
    for (const f of processedFiles) {
      archive.file(f.path, { name: f.name });
    }
    archive.finalize();

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Internal Server Error');
  }
};
