const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderTrack = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    dateTime: { type: Date, required: true },
    orderStatus: { type: String, required: true }
});

module.exports = mongoose.model("OrderTrack", orderTrack);