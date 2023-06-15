const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const menuSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: Number,
    dishes: []
})

module.exports = mongoose.model('Menu', menuSchema);