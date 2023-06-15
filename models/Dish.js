const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dishSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    ingredients: { type: String, required: false },
    category: { type: String, required: false }
});

module.exports = mongoose.model('Dish', dishSchema);