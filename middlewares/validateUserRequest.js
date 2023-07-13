const validator = require("email-validator");
const isValidPassword = require('../utils/isValidPassword');

const validateEmployeeRequest = (req, res, next) => {
    const { 
        name,
        emailAddress,
        password,
        confirmPassword 
    } = req.body;
        if(!name) return res.status(400).json({ 'message': 'Name is required'});
        if(!password) return res.status(400).json({ 'message': 'Password is required'});
        if(password !== confirmPassword) return res.status(400).json({ 'message': 'Password and Confirm Password must match' });
        if(!isValidPassword(password)) return res.status(400).json({ 'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character' });
        if(!emailAddress) return res.status(400).json({message: 'Email address is required'});
        next();
}

module.exports = validateEmployeeRequest;