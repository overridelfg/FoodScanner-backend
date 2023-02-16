const Product = require('../models/product')

exports.getProduct = async (req, res, next) => {
    try{
        const products = await Product.findOne({id: 1});
        res.status(200).json(products)
    }catch(err){

    }
};