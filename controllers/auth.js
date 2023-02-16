const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
// const {validationResult} = require('express-validator/check');

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
            console.log(loadedUser)
            return bcrypt.compare(password, user.password);
        }
    ).then(isEqual => {
        if(!isEqual){
            res.status(405).json({error: "Пароль неверный!"});
        }
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser._id.toString()
        }, 'youdontstealmypassword',
         {expiresIn: '1h'})
         res
         .status(200)
         .json({
            token: token,
            user: {
                id: loadedUser._id.toString(),
                email: loadedUser.email,
                name: loadedUser.name,
                diets: loadedUser.diets,
                allergens: loadedUser.allergens
            }
        })
    }).catch(err => {
        console.log(err)
    })
}

exports.register = async (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const diets = req.body.diets;
    const allergens = req.body.allergens;
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
                res
                .status(200)
                .json(
                    {
                        token: 'A',
                        user: {
                        id: user._id.toString(),
                        email: email,
                        password: hasedPassword,
                        name: name,
                        diets: diets,
                        allergens: allergens
                    }}
                );
            }
        });
    }).catch(err=>{
        console.log(err);
    })
}

