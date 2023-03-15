const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const productImageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('ProductImage', productImageSchema, 'images')