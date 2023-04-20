const express = require('express')

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/details/:barcode', productsController.getProduct);

router.get('/list', productsController.getRestrictedProducts);

router.get('/list/restricted', productsController.getRestrictedProducts);

router.get('/parse', productsController.getProductsParse);

router.get('/search', productsController.getProductSearch);

router.get('/isProductValid/:product_id', productsController.getIsProductValid);

module.exports = router;