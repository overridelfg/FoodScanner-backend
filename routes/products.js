const express = require('express')

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/details/:barcode', productsController.getProduct);

router.get('/list', productsController.getProducts);

router.get('/parse', productsController.getProductsParse);

module.exports = router;