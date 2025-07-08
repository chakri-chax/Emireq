// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// GET all items
router.get('/', itemController.getAllItems);

// GET single item
router.get('/:id', itemController.getItemById);

// POST create new item
router.post('/', itemController.createItem);

module.exports = router;