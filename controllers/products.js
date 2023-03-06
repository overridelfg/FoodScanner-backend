const Product = require('../models/product')

exports.getProduct = async (req, res, next) => {
    try{
        const barcode = req.params.barcode
        const products = await Product.findOne({
            Barcode : barcode});
        res.status(200).json(products)
    }catch(err){

    }
};