// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');


router.get('/getToken', tokenController.getToken);


router.post('/createToken', tokenController.createToken);


module.exports = router;