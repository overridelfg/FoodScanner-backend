const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/product')
const config = require('./config')

const restrictionsRoutes = require('./routes/restrictions');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth')

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization, x-refresh-token');
    next();
})

app.use('/auth', authRoutes);
app.use('/restrictions', restrictionsRoutes);
app.use('/products', authMiddleware, productsRoutes);

const client = mongoose.connect(config.database.mongoUri)
.then(result => {
    console.log('connected');
    app.listen(config.server.port);
}).catch(err => {
    console.log(err);
});
