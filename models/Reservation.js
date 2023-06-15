const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { reservationStatuses } = require('../config/statuses');

const reservationSchema = new Schema({
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: false },
    dateTime: { type: Date, required: true },
    partySize: Number,
    status: { type: String, default: reservationStatuses.Pending }
});

module.exports = mongoose.model('Reservation', reservationSchema);