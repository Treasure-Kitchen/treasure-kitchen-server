const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stateSchema = new Schema({
    name: { type: String, required: true },
    country: { type: Schema.Types.ObjectId, ref: "Country" }
});

module.exports = mongoose.model("State", stateSchema);