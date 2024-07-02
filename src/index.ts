import express from 'express';
import bodyParser from 'body-parser';
import identifyRoutes from './routes/identify';

const app = express();

app.use(bodyParser.json());
app.use('/api', identifyRoutes);
app.get('/', (req, res) => {
  res.send('Server is Up and running');
},);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
