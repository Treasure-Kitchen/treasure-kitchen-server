const validator = require("email-validator");
const validatePhoneNumber = require('validate-phone-number-node-js');
const isValidPassword = require('../utils/isValidPassword');

const validateEmployeeRequest = (req, res, next) => {
    const { 
        firstName,
        lastName,
        position,
        department,
        salary,
        emailAddress,
        phoneNumber,
        employmentDate,
        password,
        confirmPassword 
    } = req.body;

        if(!firstName) return res.status(400).json({ 'message': 'First Name is required'});
        if(!lastName) return res.status(400).json({ 'message': 'Last Name is required'});
        if(!position) return res.status(400).json({ 'message': 'Employee Position is required'});
        if(!department) return res.status(400).json({ 'message': 'Employee Department is required'});
        if(salary && salary <= 0)  return res.status(400).json({ 'message': 'Salary must be greater than 0'});
        if(!employementDate) return res.status(400).json({ 'message': 'Employment Date is required'});
        if(!password) return res.status(400).json({ 'message': 'Password is required'});
        if(!validator.validate(emailAddress)) return res.status(400).json({ 'message': 'Invalid email address' });
        if(!validatePhoneNumber.validate(phoneNumber)) return res.status(400).json({ 'message': 'Invalid phone number.' });
        if((new Date()).getTime() < (new Date(employmentDate).getTime())) return res.status(400).json({ 'message':'Employment Date cannot be in the future' });
        if(password !== confirmPassword) return res.status(400).json({ 'message': 'Password and Confirm Password must match' });
        if(!isValidPassword(password)) return res.status(400).json({ 'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character' })
        
        next();
}

module.exports = validateEmployeeRequest;