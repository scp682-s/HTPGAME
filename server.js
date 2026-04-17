import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from './api/generate_report.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API route
app.all('/api/generate_report', (req, res) => {
  handler(req, res);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/generate_report`);
});
