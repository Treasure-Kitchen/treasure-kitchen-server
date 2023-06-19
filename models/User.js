const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: Number, required: true },
    refreshToken: { type: String, default: '' },
    isEmailConfirmed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    isActive: { type: Boolean, default: false },
    password: { type: String, required: true },
    emailToken: { type: Number, unique: true, required: false },
    tokenExpiryTime: Date,
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: "Order"
        }
    ]
});

module.exports = mongoose.model('User', userSchema);