const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    locality: { type: String, required: true },
    adminArea: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
});

module.exports = mongoose.model("Address", addressSchema);