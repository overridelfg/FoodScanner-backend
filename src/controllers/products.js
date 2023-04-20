const Product = require('../models/product')
const User = require('../models/user')
const ProductImage = require('../models/product_image')
const jwt = require('jsonwebtoken')
const authController = require('./auth')
const { json } = require('body-parser')
const math = require('mathjs')

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
            
            const answer = isProductValid(currentUser, productIngredients);
            let isValid = false
            if(answer.length === 0){
                isValid = true
            }
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
            const userId = decodeToken.userId;
            await User.findOne({_id: userId}).then(
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
            const answer = isProductValid(currentUser, productIngredients)
            if(answer.length !== 0){
                const productName = product[0].Name + product[0].Weight
                const productImage = await ProductImage.findOne(
                    {
                        title: productName
                    }
                )

                product[0]["Jpg"] = productImage.img
                product[0]["isValid"] = false
                // count = count - 1;
                products.push(product[0])
            }
        }
            
        res.status(200).json(products)
        
    }catch(err){
        console.log(err)
    }
}


exports.getProductSearch = async(req, res, next) => {
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

        const productName =  req.query.name;
        const products = (await Product.find({Name: new RegExp('^' + productName + '.*', 'i')}).exec()).slice(0, 10)
        const productsResponse = []
        for(let i = 0; i < products.length; i++){
        
            const productName = products[i].Name + products[i].Weight
            const productImage = await ProductImage.findOne(
                {
                    title: productName
                }
            )
            products[i]["Jpg"] = productImage.img
            productIngredients = products[i].Description.split(',');
            const answer = isProductValid(currentUser, productIngredients);
            let isValid = false
            if(answer.length === 0){
                isValid = true
            }
            
            productsResponse.push({
                id: products[i]["id"],
                Name: products[i]["Name"],
                Barcode: products[i]["Barcode"],
                Description: products[i]["Description"],
                Proteins: products[i]["Proteins"],
                Fats: products[i]["Fats"],
                Carbohydrates: products[i]["Carbohydrates"],
                Kcal: products[i]["Kcal"],
                Kj: products[i]["Kj"],
                Weight: products[i]["Weight"],
                Jpg: products[i]["Jpg"],
                isValid: isValid
            })
        }
        res.status(200).json(productsResponse);
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
        let decodeToken;
        try{
            decodeToken = jwt.verify(token, 'youdontstealmypassword');
            const userId = decodeToken.userId;
            await User.findOne({_id: userId}).then(
                user => {
                        return isProductValid(user, productIngredients)    
                    }
            ).then(result => {
                let isValid = false;
                if(result.length === 0){
                    isValid = true
                }
                const response = {
                    answer : result,
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

const isProductValid = (user, productIngredients) => {
    const restrictedIngredients = new Set();
    const restrictedIngredientsList = []
    const productIngredientsSet = new Set();
    const productIngredientsList = [];
    const ingredientsSet =  new Set();
    const answer = [];
    for(let i = 0; i < user.diets.length; i++){
        const userDietsRestrictedIngredients = user.diets[i].restricted_ingredients; 
        for(let j = 0; j < userDietsRestrictedIngredients.length; j++){
            restrictedIngredients.add(userDietsRestrictedIngredients[j]);
            restrictedIngredientsList.push(userDietsRestrictedIngredients[j].split(' '));
            const userDietsRestrictedIngredient = userDietsRestrictedIngredients[j].split(' ');
            for(let k = 0; k < userDietsRestrictedIngredient.length; k++){
                ingredientsSet.add(userDietsRestrictedIngredient[k].toLowerCase());
            }
        }
    }
    for(let i = 0; i < productIngredients.length; i++){
        productIngredientsSet.add(productIngredients[i].toLowerCase().trim());
        productIngredientsList.push(productIngredients[i].toLowerCase().trim().split(' '));
        const productIngredient = productIngredients[i].split(' ');
        for(let j = 0; j < productIngredient.length; j++){
            if(productIngredient[j] != ''){
                ingredientsSet.add(productIngredient[j].toLowerCase());
            }
        }
    }

    let arrA = []
    restrictedIngredients.forEach(restrictedIngredient =>{
        const firstRowIngredient = [];
        ingredientsSet.forEach(ingredient=> {
            if(restrictedIngredient.split(' ').includes(ingredient)){
                firstRowIngredient.push(1);
            }else{
                firstRowIngredient.push(0);
            }
        })
        arrA.push(firstRowIngredient);
    })


    let arrB = []
    productIngredientsSet.forEach(productIngredient =>{
        const firstRowIngredient = [];
        ingredientsSet.forEach(ingredient=> {
            if(productIngredient.split(' ').includes(ingredient)){
                
                firstRowIngredient.push(1);
            }else{
                firstRowIngredient.push(0);
            }
        })
        arrB.push(firstRowIngredient);
    });
     arrA = math.transpose(arrA);
     const arrResult = math.multiply(arrB, arrA);
     for(let i = 0; i < productIngredientsSet.size; i++){
        for(let j = 0; j < restrictedIngredients.size; j++){
            const min = math.min(restrictedIngredientsList[j].length, productIngredientsList[i].length);
            arrResult[i][j] /= min;
            if(arrResult[i][j] > 0.7){
                answer.push(restrictedIngredientsList[j].join(' '));
            }
        }
     }
     return answer;
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