const express = require('express');

const userController = require('../controllers/user');

const router = express.Router();

router.get('/allergens', userController.getUserAllergens);

router.get('/diets', userController.getUserDiets);

router.post('/updateRestrictions',userController.updateUserRestrictions)

module.exports = router;