const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const countrySchema = new Schema({
    name: { type: String, required: true, unique: true },
    states: [{ type: Schema.Types.ObjectId, ref: "State" }]
});

module.exports = mongoose.model("Country", countrySchema);