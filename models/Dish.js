const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dishSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    photo: { type: String, default: '' },
    publicId: { type: String, default: '' },
    orders: Array
});

module.exports = mongoose.model('Dish', dishSchema);