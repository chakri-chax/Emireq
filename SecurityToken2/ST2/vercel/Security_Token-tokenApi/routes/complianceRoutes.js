// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');

router.post('/deploy-modules', complianceController.deployModules);

// router.post('/createToken', tokenController.createToken);

module.exports = router;