const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { tableStatuses } = require('../config/statuses');

const tableSchema = new Schema({
    number: { type: Number, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, default: tableStatuses.Available},
    reservations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Reservation"
        }
    ]
});

module.exports = mongoose.model('Tables', tableSchema);