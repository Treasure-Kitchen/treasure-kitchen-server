const mongoose = require('mongoose');
const ROLES = require('../config/roles');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    googleId: String,
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, dropDups: true },
    photo: String,
    role: { type: Schema.Types.ObjectId, ref: "Role" },
    createdAt: { type: Date, default: new Date() },
    lastLogin: Date,
    refreshToken: { type: String, default: '' },
    isEmailConfirmed: { type: Boolean, default: false },
    password: String,
    publicId: { type: String, default: '' },
    emailToken: { type: String, default: '' },
    tokenExpiryTime: Date,
    address: { type: Schema.Types.ObjectId, ref: "Address" },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }]
});

module.exports = mongoose.model('User', userSchema);