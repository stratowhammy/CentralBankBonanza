const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/advisor', require('./routes/advisor'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Central Bank Bonanza Simulator API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production if built
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// For SPA routing, redirect unmatched non-API requests to index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath, err => {
      if (err) {
        return res.status(200).send('Central Bank Bonanza API is running. Build the frontend with `npm run build` or use Vite dev server on port 5173.');
      }
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Central Bank Bonanza server listening on port ${PORT}`);
});
