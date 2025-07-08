const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const investorIdentities = require('./scripts/integration/FrontendIntegration/investorIdentities');
const itemRoutes = require('./routes/itemRoutes');
const identityRoutes = require('./routes/identityRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://your-frontend-domain.com'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));
app.use(bodyParser.json());


cron.schedule('*/10 * * * * *', () => {
  investorIdentities.createIdentitiesForInvestors();
});
// Routes
app.use('/api/items', itemRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/compliance', complianceRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to the Node.js API Server');
});





app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});