const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, dropDups: true },
    role: { type: Number, required: true },
    refreshToken: { type: String, default: '' },
    isEmailConfirmed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    isActive: { type: Boolean, default: false },
    password: { type: String, required: true },
    emailToken: { type: Number, unique: true, required: false, dropDups: true },
    tokenExpiryTime: Date,
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: "Order"
        }
    ]
});

module.exports = mongoose.model('User', userSchema);