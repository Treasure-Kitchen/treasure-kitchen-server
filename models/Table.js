const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { tableStatuses } = require('../config/statuses');

const tableSchema = new Schema({
    name: { type: String, unique: true, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, default: tableStatuses.Available}
});

module.exports = mongoose.model('Tables', tableSchema);