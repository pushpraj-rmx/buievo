import express from 'express';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // For parsing application/json

app.get('/', (req, res) => {
  res.send('Hello from the API!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', healthRoutes);

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
