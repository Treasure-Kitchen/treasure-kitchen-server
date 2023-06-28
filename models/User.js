const mongoose = require('mongoose');
const ROLES = require('../config/roles');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    googleId: String,
    facebookId: String,
    twitterId: String,
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    photo: String,
    role: { type: Number, default: ROLES.User },
    createdAt: { type: Date, default: new Date() },
    lastLogin: Date,
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: "Order"
        }
    ]
});

module.exports = mongoose.model('User', userSchema);