const express = require('express');

const restrictionsController = require('../controllers/restrictions');

const router = express.Router();

router.get('/diets', restrictionsController.getDiets);

router.get('/allergens', restrictionsController.getAllergens);



module.exports = router;