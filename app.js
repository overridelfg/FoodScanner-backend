const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/product')

const restrictionsRoutes = require('./routes/restrictions');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    next();
})

app.use('/auth', authRoutes);
app.use('/restrictions', restrictionsRoutes);
app.use('/products', productsRoutes);



const client = mongoose.connect('mongodb+srv://override:minelego2002@cluster0.afiyjyf.mongodb.net/foodscanner_db?retryWrites=true&w=majority')
.then(result => {
    console.log('connected')
    app.listen(8080);
}).catch(err => {
    console.log(err);
});
