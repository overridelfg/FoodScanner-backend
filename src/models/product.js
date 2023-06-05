const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosastic = require('mongoosastic')

const productSchema = new Schema({
    id:{
        type: Number,
        required: true,
        lowercase: true,
    },
    Name: {
        type: String,
        required: true
    },
    Barcode: {
        type: Number,
        required: true
    },
    Description:{
        type: String,
        required: true
    },
    Proteins:{
        type: String,
        required: true
    },
    Fats:{
        type: String,
        required: true
    },
    Carbohydrates:{
        type: String,
        required: true
    },
    Kcal:{
        type: String,
        required: true
    },
    Kj:{
        type: Number,
        required: true
    },
    Weight:{
        type: String,
        required: true
    },
    Jpg:{
        type: String,
        required: true
    },
});

productSchema.plugin(mongoosastic)

module.exports = mongoose.model('Product', productSchema);