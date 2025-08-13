const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const analyzeRouter = require('./routes/analyze');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', analyzeRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'Twitter Hate Speech & Sentiment Analyzer API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dummy mode: ${config.USE_DUMMY_DATA ? 'enabled' : 'disabled'}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
});