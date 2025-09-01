import express from 'express';
import analyzeRouter from './api/analyze';

const app = express();
app.use(express.json());
app.use('/analyze', analyzeRouter);

const port = process.env.PORT || 8081;
app.listen(port, () => console.log('Analyze API listening on', port));
