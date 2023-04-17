const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    tokenId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Token', tokenSchema);