const Product = require('../models/product')
const User = require('../models/user')
const ProductImage = require('../models/product_image')
const jwt = require('jsonwebtoken')
const authController = require('./auth')
const { json } = require('body-parser')

exports.getProduct = async (req, res, next) => {
    try{
        const barcode = req.params.barcode
        var product = await Product.findOne({
            Barcode : barcode});
        const productName = product.Name + product.Weight
        const productImage = await ProductImage.findOne(
            {
                title: productName
            }
        )

        var newProduct = product
        newProduct["Jpg"] = productImage.img

        res.status(200).json(product)
    }catch(err){

    }
};

exports.getProducts = async (req, res, next) => {
    try{
        const token = req.get('Authorization').split(' ')[1];
        let currentUser;

        try{
            const decodeToken = jwt.verify(token, 'youdontstealmypassword');
            const userId = decodeToken.userId;
            await User.findOne({_id: userId}).then(
                user => {
                    currentUser = user;
                }  
            )
        }catch(err){
            console.log(err)
        }

        const products = await Product.aggregate([
            { $sample: { size: 10 } }
        ]);

        for(let i = 0; i < products.length; i++){
            const productName = products[i].Name + products[i].Weight
            const productImage = await ProductImage.findOne(
                {
                    title: productName
                }
            )
            products[i]["Jpg"] = productImage.img
            productIngredients = products[i].Description.split(',');
            
            const isValid = validateProduct(currentUser, productIngredients)
            products[i]["isValid"] = isValid
        }
        res.status(200).json(products)
        
    }catch(err){

    }
}


exports.getRestrictedProducts = async (req, res, next) => {
    try{
        const token = req.get('Authorization').split(' ')[1];
        let currentUser;
        console.log(token)
        try{
            const decodeToken = jwt.verify(token, 'youdontstealmypassword');
            const email = decodeToken.email;
            await User.findOne({email: email}).then(
                user => {
                    currentUser = user;
                }  
            )
        }catch(err){
            console.log(err)
        }
        console.log(currentUser)
        let products = [];
        let count = 10;
        while(count !== 0){
            const product = await Product.aggregate([
                { $sample: { size: 1 } }
            ]);

            
            productIngredients = product[0].Description.split(',');
            
            const isValid = validateProduct(currentUser, productIngredients)
            console.log(isValid)
            if(!isValid){
                const productName = product[0].Name + product[0].Weight
                const productImage = await ProductImage.findOne(
                    {
                        title: productName
                    }
                )
                console.log("ok")
                product[0]["Jpg"] = productImage.img
                product[0]["isValid"] = isValid
                console.log("ok")
                count = count - 1;
                console.log("ok")
                products.push(product[0])
                console.log("ok")
            }
        }
            
        res.status(200).json(products)
        
    }catch(err){

    }
}

const validateProduct = (user, productIngredients) => {
    for(let i = 0; i < user.diets.length; i++){
        const userDietsRestrictedIngredients = user.diets[i].restricted_ingredients;
        for(let j = 0; j < userDietsRestrictedIngredients.length; j++){
            const restrictedIngredient = userDietsRestrictedIngredients[j].split(' ');
            for(let k = 0; k < productIngredients.length; k++){
                const productIngredient = productIngredients[k].split(' ');
                let count = 0;
                for(let m = 0; m < productIngredient.length; m++){
                    const productIngredientLowerCase = productIngredient[m].toLowerCase()
                    if(restrictedIngredient.includes(productIngredientLowerCase)){
                        count++;
                    }
                }
                if(count === restrictedIngredient.length){
                    return false;
                }
            }
        }
    }
    return true
}

exports.getProductSearch = async(req, res, next) => {
    try{
        const productName =  req.query.name;
        const products =  await (await Product.find({Name: new RegExp('^' + productName + '.*', 'i')}).exec()).slice(0, 10);

    

        for(let i = 0; i < products.length; i++){
            const productName = products[i].Name + products[i].Weight
            const productImage = await ProductImage.findOne(
                {
                    title: productName
                }
            )
            products[i]["Jpg"] = productImage.img
        }
        res.status(200).json(products);
    }catch(err){

    }
}

exports.getIsProductValid = async(req, res, next) => {
    try{
        const token = req.get('Authorization').split(' ')[1];
        const product_id = req.params.product_id;
        let product, productIngredients;
        try{
            await Product.findOne({id: product_id}).then(
                productDetails => {
                    product = productDetails.Description;
                    productIngredients = product.split(',');
                }
            )
        }catch(err){

        }
        let answer = []
        let decodeToken;
        try{
            decodeToken = jwt.verify(token, 'youdontstealmypassword');
            const userId = decodeToken.userId;
            await User.findOne({_id: userId}).then(
                user => {
                        for(let i = 0; i < user.diets.length; i++){
                            const userDietsRestrictedIngredients = user.diets[i].restricted_ingredients; 
                            for(let j = 0; j < userDietsRestrictedIngredients.length; j++){
                                const restrictedIngredient = userDietsRestrictedIngredients[j].split(' ');
                                for(let k = 0; k < productIngredients.length; k++){
                                    const productIngredient = productIngredients[k].split(' ');
                                    let count = 0;
                                    for(let m = 0; m < productIngredient.length; m++){
                                        const productIngredientLowerCase = productIngredient[m].toLowerCase()
                                        if(restrictedIngredient.includes(productIngredientLowerCase)){
                                            count++;
                                        }
                                    }
                                    if(count === restrictedIngredient.length){
                                        if(!answer.includes(userDietsRestrictedIngredients[j])){
                                            answer.push(userDietsRestrictedIngredients[j]);
                                        }
                                    }
                                }
                            }
                        }
                    }
            ).then(result => {
                let isValid = false;
                if(answer.length === 0){
                    isValid = true
                }
                const response = {
                    answer : answer,
                    status : isValid
                }
                res.status(200).json(response);
            })
        }catch(err){
            console.log(err)
        }
    
    }catch(err){
        console.log(err)
    }
}


exports.getProductsParse = async(req, res, next) => {
    const products = await Product.find()
    var fs = require('fs');
    let productsNames = [];
    for(let i = 0; i < products.length; i++){
        let name = products[i]['Name'].replace('%', ' процент');
        productsNames.push(name + products[i]['Weight']);
    }

    var Scraper = require('images-scraper');

    const google = new Scraper({
    puppeteer: {
        headless: false,
    },
    });

    let productsImages = "";
    try{
        (async () => {
            for(let i = 0; i <= products.length; i++){
            try{
            const results = await google.scrape(productsNames[i], 1);
            console.log(results[0]['url']);
            productsImages += i + 1 + " " + results[0]['url'] + "\n";
            fs.writeFile('C:/Users/kiril/NodeJSProjects/FoodScanner-backend/foodScannerImages1.txt', productsImages, function(error){
                if(error) throw error; // ошибка чтения файла, если есть
                console.log('Данные успешно записаны записать файл');
             });
            }catch(err){
                console.log(err);
                productsImages += i + 1 + "\n"
                fs.writeFile('C:/Users/kiril/NodeJSProjects/FoodScanner-backend/foodScannerImages1.txt', productsImages, function(error){
                    if(error) throw error; // ошибка чтения файла, если есть
                    console.log('Данные успешно записаны записать файл');
                 });
            }
            }
            })();
    }catch(err){
        console.log(err);
    }
} 