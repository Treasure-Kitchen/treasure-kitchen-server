const validator = require("email-validator");
const isValidPassword = require("../utils/isValidPassword");
const { TWO } = require("../helpers/helperFs");

const verifyUserRegistration = (req, res, next) => {
    const {
        name,
        email,
        password,
        confirmPassword
    } = req.body;

    if(!name) return res.status(400).json({message: 'Name is required.'});
    const nameArray = name.split(' ');
    if(!(nameArray.length >= TWO)) return res.status(400).json({message: 'First name and Last name are required.'});
    if(!validator.validate(email)) return res.status(400).json({ 'message': 'Invalid email address' });
    if(!password) return res.status(400).json({message: 'Password is required. '});
    if(password !== confirmPassword) return res.status(400).json({ 'message': 'Password and Confirm Password must match' });
    if(!isValidPassword(password)) return res.status(400).json({ 'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character' })
    
    next();
};

module.exports = verifyUserRegistration;