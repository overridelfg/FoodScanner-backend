const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh-token', authController.refreshTokens);

module.exports = router;

/*
, [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc){
                return Promise.reject('Email adress already exist!');
            }
        })
    })
    .normalizeEmail(),
    body('password')
    .trim()
    .isLength({min: 4}),
    body('name')
    .trim()
    .not()
    .isEmpty()
]
*/