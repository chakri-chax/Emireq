const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');
// GET all items

router.post('/createIdentity', identityController.createIdentity);

router.get('/getIdentity', identityController.getIdentity);
router.get('/idFactoryAddress', identityController.idFactoryAddress);
router.get('/getKeyData', identityController.getKeyData);
module.exports = router;