const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const authHelper = require('../helpers/authHelper');
const Token = require('../models/token');
const config = require('../config')


const updateTokens = (userId) => {
    const accessToken = authHelper.generateAccessToken(userId);
    const refreshToken = authHelper.generateRefreshToken();

    console.log(refreshToken)
    console.log("refreshToken")
    authHelper.replaceDbRefreshToken(refreshToken.id, userId)
    return {
        accessToken,
        refreshToken: refreshToken.token
    }
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    let loadedUser;
    User.findOne({email: email}).then(
        user => {
            if(!user){
                res.status(404).json({error: "Пользователя не существует!"})
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        }
    ).then(isEqual => {
        if(!isEqual){
            res.status(405).json({error: "Пароль неверный!"});
            return;
        }
        const tokens = updateTokens(loadedUser._id)
            res.status(200).json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: loadedUser._id.toString(),
                    email: loadedUser.email,
                    name: loadedUser.name,
                    diets: loadedUser.diets,
                    allergens: loadedUser.allergens
                }
            })
    }).catch(err => {
        res.status(500).json({error: err.message});
    })
}

exports.register = async (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const diets = req.body.diets;
    const allergens = req.body.allergens;
    let loadedUser;
    bcrypt.hash(password, 12).then(hasedPassword => {
        const user = User({
            email: email,
            password: hasedPassword,
            name: name,
            diets: diets,
            allergens: allergens
        });
        User.findOne({email: email}).then(userDoc => {
            if(userDoc){
                res
                .status(400)
                .json({error: "Пользователь уже существует"})
            }else{
                user.save();
                loadedUser = user;
                const tokens = updateTokens(loadedUser._id)
                res.status(200).json({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    user: {
                        id: loadedUser._id.toString(),
                        email: loadedUser.email,
                        name: loadedUser.name,
                        diets: loadedUser.diets,
                        allergens: loadedUser.allergens
                    }
                });
            }
        });
    }).catch(err=>{
        res.status(500).json({error: err.message});
    })
}

exports.refreshTokens = (req, res) => {
    const refreshToken = req.get('x-refresh-token');
    if(!refreshToken){
        res.status(401).json({error : 'Refresh token not provided!'});
        return;
    }
    let payload;
    try{
        payload = jwt.verify(refreshToken, config.server.jwt.secret)
        console.log(payload)
        if(payload.type !== 'refresh'){
            res.status(400).json({error: 'Invalid token!'});
            return;
        }
    }catch(err){
        if(err instanceof jwt.TokenExpiredError){
            res.status(401).json({error: 'Token expired!'});
            return;
        }else if(err instanceof jwt.JsonWebTokenError){
            res.status(400).json({error: 'Invalid token!'});
            return;
        }
    }
    Token.findOne({tokenId: payload.id})
    .exec()
    .then((token) => {
        if(token === null){
            throw new Error('Invalid token!')
        }
        return updateTokens(token.userId)
    })
    .then(tokens => res.json(tokens))
    .catch(err => res.status(500).json({error: err.message}))
}


