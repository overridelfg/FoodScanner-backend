const express = require('express')

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/one', productsController.getProduct);

module.exports = router;