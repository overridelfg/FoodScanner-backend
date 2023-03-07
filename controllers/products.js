const Product = require('../models/product')

exports.getProduct = async (req, res, next) => {
    try{
        const barcode = req.params.barcode
        const products = await Product.findOne({
            Barcode : barcode});
            console.log(products)
        res.status(200).json(products)
    }catch(err){

    }
};

exports.getProducts = async (req, res, next) => {
    try{
        const products = await Product.aggregate([
            { $sample: { size: 10 } }
        ]).then((res) => {
            res.status(200).json(res)
        })
        
    }catch(err){

    }
}