const Diet = require('../models/diet');
const Allergen = require('../models/allergen');

exports.getDiets = async (req, res, next) => {
    try{
        const diets = await Diet.find();
        res.status(200).json(diets);
    }catch(err){

    }
};

exports.getAllergens = async (req, res, next) => {
    try{
        const allergens = await Allergen.find();
        res.status(200).json(allergens);
    }catch(err){

    }
};

