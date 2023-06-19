const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { orderStatuses, paymentStatuses } = require('../config/statuses');

const orderSchema = new Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: String,
    tableName: { type: String, required: true },
    status: { type: String, default: orderStatuses.Pending },
    price: Number,
    amountPaid: { type: Number, default: 0 },
    balance: Number,
    dateTime: { type: Date, default: Date.now },
    paymentStatus: { type: String, dafault: paymentStatuses.No },
    otp: { type: Number, unique: true, required: false },
    dishes: [
        {
            type: Schema.Types.ObjectId,
            ref: "Dish"
        }
    ]
});

module.exports = mongoose.model('Order', orderSchema);