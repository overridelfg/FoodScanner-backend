const User = require('../models/user');
const Diet = require('../models/diet');
const Allergen = require('../models/allergen');
const jwt = require('jsonwebtoken');

exports.getUserDiets = async (req, res, next) => {
    const token = req.get('Authorization').split(' ')[1];

    try{
        const decodeToken = jwt.verify(token, 'youdontstealmypassword');
        const userId = decodeToken.userId;
        await User.findOne({_id: userId}).then(
            user => {
                const response = []
                for(let i = 0; i < user.diets.length; i++){
                    response.push({
                        id: user.diets[i].id,
                        title: user.diets[i].title,
                        description: user.diets[i].description
                    })
                }
                res.status(200).json(response);
            }  
        )
    }catch(err){
        console.log(err)
    }
}

exports.getUserAllergens = async (req, res, next) => {
    const token = req.get('Authorization').split(' ')[1];

    try{
        const decodeToken = jwt.verify(token, 'youdontstealmypassword');
        const userId = decodeToken.userId;
        await User.findOne({_id: userId}).then(
            user => {
                const response = []
                for(let i = 0; i < user.allergens.length; i++){
                    response.push({
                        id: user.allergens[i].id,
                        title: user.allergens[i].title,
                        description: user.allergens[i].description
                    })
                }
                res.status(200).json(response);
            }  
        )
    }catch(err){
        res.status(400).json({error: err})
    }
}

exports.updateUserRestrictions = async (req, res, next) => {
    const token = req.get('Authorization').split(' ')[1];
    const diets = req.body.diets;
    const allergens = req.body.allergies;
    let currentUser;

    console.log(diets)
    console.log(allergens)
    let currentAllergens = [];
    let currentDiets = [];
    try{
        for(let i = 0; i < diets.length; i++){
            await Diet.findOne({id: diets[i].id}).then(
                diet => {
                    currentDiets.push(diet)
                }
            )
        }
    
        for(let i = 0; i < allergens.length; i++){
            await Allergen.findOne({id: allergens[i].id}).then(
                allergen => {
                    currentAllergens.push(allergen)
                }
            )
        }
    }catch(err){
        console.log(err)
    }
    
    try{
        const decodeToken = jwt.verify(token, 'youdontstealmypassword');
        const userId = decodeToken.userId;
        await User.updateOne({_id: userId}, {$set: {diets: currentDiets}})
        await User.updateOne({_id: userId}, {$set: {allergens: currentAllergens}})
    }catch(err){
        console.log(err)
    }


    try{
        res.status(200).json({message: "Успешно обновили данные!"});
    }catch(err){
        res.status(400).json({error: err})
    }
}