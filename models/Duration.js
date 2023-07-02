const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const durationSchema = new Schema({
    inWords: { type: String, required: true, unique: true, dropDups: true },
    inFigure: { type: Number, required: true, unique: true, dropDups: true }
});

module.exports = mongoose.model('Duration', durationSchema);