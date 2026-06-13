import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory if available
app.use(express.static(path.join(__dirname, '../public')));

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Local Development Server</title>
      </head>
      <body>
        <h1>Local Development Server Running</h1>
        <p>Your local development server is running on port ${PORT}</p>
      </body>
    </html>
  `);
});

// API endpoint example
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});