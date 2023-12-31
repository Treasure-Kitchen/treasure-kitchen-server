const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { orderStatuses, paymentStatuses } = require('../config/statuses');

const orderSchema = new Schema({
    phoneNumber: String,
    status: { type: String, default: orderStatuses.Pending },
    price: Number,
    amountPaid: { type: Number, default: 0 },
    balance: Number,
    dateTime: { type: Date, default: Date.now },
    paymentStatus: { type: String, dafault: paymentStatuses.NotPaid },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    customerAddress: { type: Schema.Types.ObjectId, ref: "Address" },
    dishes: [{ type: Schema.Types.ObjectId, ref: "Dish" }]
});

module.exports = mongoose.model('Order', orderSchema);