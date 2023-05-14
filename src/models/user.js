const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dietSchema = require('./diet');
const allergenSchema = require('./allergen');
const productSchema = require('./product');

const userSchema = new Schema({
    email:{
        type: String,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    diets:{
        type: [dietSchema.schema],
        required: true
    },
    allergens:{
        type: [allergenSchema.schema],
        required: true
    },
    favorites: {
        type: [productSchema.schema],
        required: true
    },
    barcode_history: {
        type: [productSchema.schema],
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);