const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const menuSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: Number,
    dishes: [{ type: Schema.Types.ObjectId, ref: "Dish" }]
})

module.exports = mongoose.model('Menu', menuSchema);