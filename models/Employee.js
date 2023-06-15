const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String, required: false },
    position: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: Number, required: false },
    emailAddress: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: Number, required: true },
    refreshToken: { type: String, default: '' },
    isEmailConfirmed: { type: Boolean, default: false },
    isTerminated: { type: Boolean, default: false },
    terminationDate: Date,
    employmentDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    password: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    emailToken: { type: Number, default: null },
    tokenExpiryTime: Date
});

module.exports = mongoose.model('Employee', employeeSchema);