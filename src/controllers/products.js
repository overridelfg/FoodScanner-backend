const Product = require('../models/product')
const User = require('../models/user')
const ProductImage = require('../models/product_image')
const jwt = require('jsonwebtoken')
const authController = require('./auth')
const { json } = require('body-parser')
const math = require('mathjs')
var stringSimilarity = require("string-similarity");
var _ = require('lodash');
const sklearn = import('sklearn');


exports.getProduct = async (req, res, next) => {
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

        const barcode = req.params.barcode
        var product = await Product.findOne({
            Barcode : barcode});
        if(product === null){
            res.status(405).json({message: "Not Found"});
            return;
        }
        const productName = product.Name + product.Weight
        const productImage = await ProductImage.findOne(
            {
                title: productName
            }
        )

        var newProduct = product
        newProduct["Jpg"] = productImage.img
        
        let isFavorite = false;
        currentUser.favorites.find((el) => {
            if(el.id.toString() === newProduct.id.toString()){

                isFavorite = true;
                return;
            }
        })

        newProduct["isFavorite"] = isFavorite

        let alreadyAdded = false;
        currentUser.barcode_history.find((el) => {
            if(el.id.toString() === newProduct.id.toString()){
                alreadyAdded = true;
                return;
            }
        })

        if(!alreadyAdded){
            await User.findByIdAndUpdate(currentUser._id,
                {
                    $push: {barcode_history: newProduct}
                } )
        }
        res.status(200).json(newProduct)
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
            productIngredients = products[i].Description.replaceAll(';', ',').split(',');
            
            const answer =  validateProduct(currentUser, productIngredients);;
            let isValid = false
            if(answer.diets.length === 0 && answer.allergens.length === 0){
                isValid = true
            }
            let isFavorite = false;
            currentUser.favorites.find((el) => {
                if(el.id.toString() === products[i].id.toString()){
                    isFavorite = true;
                    return;
                }
            })
            products[i]["isValid"] = isValid
            products[i]["isFavorite"] = isFavorite
        }
        res.status(200).json(products)
        
    }catch(err){

    }
}

exports.getValidProducts = async (req, res) => {
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

        let products = [];
        let count = 10;
        while(count !== 0){
            const product = await Product.aggregate([
                { $sample: { size: 1 } }
            ]);

            
            productIngredients = product[0].Description.replaceAll(';', ',').split(',');
                const productName = product[0].Name + product[0].Weight
                const productImage = await ProductImage.findOne(
                    {
                        title: productName
                    }
                )

                product[0]["Jpg"] = productImage.img
                
                const answer =  validateProduct(currentUser, productIngredients);
                console.log(answer)
                let isValid = false
                if(answer.diets.length === 0 && answer.allergens.length === 0){
                    isValid = true
                }
                if(isValid){
                
                    let isFavorite = false;
                    currentUser.favorites.find((el) => {
                        if(el.id.toString() === product[0].id.toString()){
                            isFavorite = true;
                            return;
                        }
                    })
    
                    product[0]["isValid"] = true
                    product[0]["isFavorite"] = isFavorite
                    count = count - 1;
                    products.push(product[0])
                }
        }
        res.status(200).json(products)
              
    }catch(err){

    }
}


exports.getRestrictedProducts = async (req, res, next) => {
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
        let products = [];
        let count = 10;
        while(count !== 0){
            const product = await Product.aggregate([
                { $sample: { size: 1 } }
            ]);

            
            productIngredients = product[0].Description.replaceAll(';', ',').split(',');
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
                count = count - 1;
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
        console.log(token)
        const page = req.query.page;
        const startIndex = (page - 1) * 10
        const endIndex = page * 10
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
        const products = (await Product.find({Name: new RegExp('^' + productName + '.*', 'i')}).exec()).slice(startIndex, endIndex)
        const productsResponse = []
        console.log(products)
        for(let i = 0; i < products.length; i++){
        
            const productName = products[i].Name + products[i].Weight
            const productImage = await ProductImage.findOne(
                {
                    title: productName
                }
            )
            products[i]["Jpg"] = productImage.img
            productIngredients = products[i].Description.replaceAll(';', ',').split(',');
            const answer = validateProduct(currentUser, productIngredients);
            let isValid = false
            if(answer.diets.length === 0 && answer.allergens.length === 0){
                isValid = true
            }

            let isFavorite = false;
            currentUser.favorites.find((el) => {
                if(el.id.toString() === products[i].id.toString()){
                    isFavorite = true;
                    return;
                }
            })

            
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
                isValid: isValid,
                isFavorite: isFavorite
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
                    productIngredients = product.replaceAll(';', ',').split(',');
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
                        return validateProduct(user, productIngredients)    
                    }
            ).then(result => {
                let isValid = false;
                
                if(result.diets.length === 0 && result.allergens.length === 0){
                    isValid = true
                }
                const response = {
                    answerDiets : result.diets,
                    answerAllergens : result.allergens,
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

const validateProduct = (user, productIngredients) => {
    let diets;
    let allergens;
    if(user.diets.length === 0){
        diets = [];
    }else{
        diets = isProductValid(user.diets, productIngredients);
    }
    if(user.allergens.length === 0){
        allergens = [];
    }else{
        allergens = isProductValid(user.allergens, productIngredients);
    }
    
    return {diets: diets, allergens: allergens};
}

const isProductValid = (restrictions, productIngredients) => {
    const restrictedIngredients = new Set();
    const restrictedIngredientsList = []
    const productIngredientsSet = new Set();
    const productIngredientsList = [];
    const ingredientsSet =  new Set();


    for(let i = 0; i < restrictions.length; i++){
        const userDietsRestrictedIngredients = restrictions[i].restricted_ingredients; 
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
        const validatedProductIngredient = productIngredients[i].replaceAll(")","").replaceAll("(", "").replaceAll("-", "").replaceAll(":", "").replaceAll(";", "").replaceAll("[", "").replaceAll("]", "").replaceAll("—", "")
        productIngredientsSet.add(validatedProductIngredient.toLowerCase().trim());
        productIngredientsList.push(validatedProductIngredient.toLowerCase().trim().split(' '));
        const productIngredient = validatedProductIngredient.split(' ');
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
     const answer = [];
     for(let i = 0; i < productIngredientsSet.size; i++){
        for(let j = 0; j < restrictedIngredients.size; j++){
            if(arrResult[i][j] >= restrictedIngredientsList[j].length){

                for(let k = 0; k < restrictions.length; k++){
                    if(restrictions[k].restricted_ingredients.includes(restrictedIngredientsList[j].join(' '))){
                        if (!answer[restrictions[k].title]) answer[restrictions[k].title] = []
                        answer[restrictions[k].title].push(restrictedIngredientsList[j].join(' '));
                    }
                }
                
            }
        }
     }
     let productsRestrictionsData = []
     
     for(var key in answer){
        productsRestrictionsData.push(key + ":" + answer[key])
     }
     return productsRestrictionsData;
}

exports.addToFavorite = async(req, res, next) => {
    const token = req.get('Authorization').split(' ')[1];
    const productId = req.query.productId;
    let currentUser;
    let currentProduct;
    try{
        await Product.findOne({id: productId}).then(
            product => {
                currentProduct = product;
            }  
        )
    }catch(err){
        console.log(err)
    }
    try{
        const decodeToken = jwt.verify(token, 'youdontstealmypassword');
        const userId = decodeToken.userId;
        currentUser = await User.findById(userId);
        let alreadyAdded = false;
        currentUser.favorites.find((el) => {
            if(el.id.toString() === productId.toString()){
                alreadyAdded = true;
                return;
            }
        })
        if(alreadyAdded){
            await User.findByIdAndUpdate(userId,
                {
                    $pull: {favorites: currentProduct}
                } )
                res.status(200).json({message: "Успешно удалили!"})
                return;
        }else{
            await User.findByIdAndUpdate(userId,
                {
                    $push: {favorites: currentProduct}
                } )
                res.status(200).json({message: "Успешно добавили!"})
                return;
        }
    }catch(err){
        console.log(err)
    }
}

exports.getFavorites =  async(req, res, next) => {
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

        const products = currentUser.favorites;
        productsResponse = [];
        for(let i = 0; i < products.length; i++){
            const productName = products[i].Name + products[i].Weight
            const productImage = await ProductImage.findOne(
                {
                    title: productName
                }
            )
            products[i]["Jpg"] = productImage.img
            productIngredients = products[i].Description.replaceAll(';', ',').split(',');
            
            const answer = validateProduct(currentUser, productIngredients);
            let isValid = false;
            if(answer.diets.length === 0 && answer.allergens.length === 0){
                isValid = true;
            }

            let isFavorite = false;
            currentUser.favorites.find((el) => {
                if(el.id.toString() === products[i].id.toString()){
                    isFavorite = true;
                    return;
                }
            })
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
                isValid: isValid,
                isFavorite: isFavorite
            })
        }
        res.status(200).json(productsResponse)
}

exports.getBarcodeHistory =  async(req, res, next) => {
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

        const products = currentUser.barcode_history;
        productsResponse = [];
        for(let i = 0; i < products.length; i++){
            productIngredients = products[i].Description.replaceAll(';', ',').split(',');
            
            const answer =  validateProduct(currentUser, productIngredients);
            let isValid = false;
            if(answer.diets.length === 0 && answer.allergens.length === 0 ){
                isValid = true;
            }
        
            let isFavorite = false;
            currentUser.favorites.find((el) => {
                if(el.id.toString() === products[i].id.toString()){
                    isFavorite = true;
                    return;
                }
            })
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
                isValid: isValid,
                isFavorite: isFavorite
            })
        }
        res.status(200).json(productsResponse)
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

exports.postNonexistentProductFeedback = async(req, res) => {
    const token = req.get('Authorization').split(' ')[1];
    const firstImage = req.body;
    const secondImage = req.body;
    let currentUser;

    res.status(200).json({message: "Спасибо, что помогаете нам развивать приложение! Данные успешно отправились"})
}