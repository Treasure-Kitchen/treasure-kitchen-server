const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { orderStatuses, paymentStatuses } = require('../config/statuses');

const orderSchema = new Schema({
    customerName: { type: String, required: true },
    tableName: { type: String, required: true },
    status: { type: String, default: orderStatuses.Pending },
    dateTime: { type: Date, default: Date.now },
    paymentStatus: { type: String, dafault: paymentStatuses.No },
    dishes: []
});

module.exports = mongoose.model('Order', orderSchema);