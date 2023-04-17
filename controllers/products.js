const Product = require('../models/product')
const ProductImage = require('../models/product_image')


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
        }


exports.getRestrictedProducts = async (req, res, next) => {
    try{
        const token = req.get('Authorization').split(' ')[1];
        let currentUser;

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

        let products;
        let count = 0;
        while(count !== 10){
            const product = await Product.aggregate([
                { $sample: { size: 1 } }
            ]);

            
            productIngredients = product[0].Description.split(',');
            
            const isValid = validateProduct(currentUser, productIngredients)

            console.log(isValid)
            console.log(count)
            if(isValid){
                const productName = products[i].Name + products[i].Weight
                const productImage = await ProductImage.findOne(
                    {
                        title: productName
                    }
                )
                products[i]["Jpg"] = productImage.img
                products[i]["isValid"] = isValid
                count++;
                products.push(product)
            }
        }
            
        res.status(200).json(products)
        
    }catch(err){

    }
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