const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json'
};

http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/auth.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, filePath);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (req.url !== '/favicon.ico') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      } else {
        res.writeHead(204);
        res.end();
      }
    } else {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
}).listen(PORT, () => console.log(`Server running on port ${PORT}`));
