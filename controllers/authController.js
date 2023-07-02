const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const isValidPassword = require('../utils/isValidPassword');
const { addHours } = require('date-fns');
const { emailConfirmationMessage, resetPasswordMessage } = require('../helpers/helperFs');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { emailSlave } = require('../helpers/emailSlave');

const handleLogin = async (req, res) => {
    const { emailAddress, password } = req.body;
    if(!emailAddress || !password) return res.status(400).json({ 'message': 'Email and password are required.'});

    const foundEmployee = await Employee.findOne({ emailAddress: emailAddress }).exec();
    if(!foundEmployee) return res.status(404).json({'message':`No user found with email: ${emailAddress}`});
    if(foundEmployee.isTerminated) return res.status(403).json({message: 'You have been terminated. Your access has been revoked'})
    if(!foundEmployee.isEmailConfirmed) {
        try {
            const payload = {
                name: foundEmployee.firstName,
                email: foundEmployee.emailAddress,
                subject: "Confirm Your Email",
                messageText: emailConfirmationMessage(),
                file: "ConfirmEmail.html"
            }
            
            const result = await emailSlave(payload);
            if(!result?.isSuccess) return res.status(400).json({message:'Login failed. Please try again.'});
            //set the user token and the expiry time
            foundEmployee.emailToken = result?.token;
            foundEmployee.tokenExpiryTime = addHours(Date.now(), 2);
            await foundEmployee.save();
            res.cookie('cnfm', emailAddress, { httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
            return res.status(400).json({message:'Confirm your account before attempting to log in. Please check your mail.', toConfirmEmail: true})
        } catch (error) {
            res.status(500).json({'message':error.message });
        }
    }

    //check password
    const match = await bcrypt.compare(password, foundEmployee.password);
    if(match){
        //create JWT
        const accessToken = generateAccessToken(foundEmployee.role, foundEmployee._id, '1d');
        const refreshToken = generateRefreshToken(foundEmployee._id, '1d');
        //set refresh token for user
        foundEmployee.refreshToken = refreshToken;
        foundEmployee.lastLogin = new Date();
        foundEmployee.save();
        //set the refresh token in cookie
        const user = {
            id: foundEmployee._id,
            displayName: `${foundEmployee.firstName} ${foundEmployee.lastName}`,
            email: foundEmployee.emailAddress, 
            photo: foundEmployee.photoUrl, 
            role: foundEmployee.role, 
            createdAt: foundEmployee.createdAt,
            lastLogin: foundEmployee.lastLogin
        };
        res.cookie('jwt', refreshToken, { httpOnly: false, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
        res.status(200).json({ accessToken, user });
    } else {
        res.status(400).json({'message':'Password is not correct.'});
    }
};

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundEmployee = await Employee.findOne({ refreshToken: refreshToken });
    if(!foundEmployee){
        res.clearCookie('jwt', { httpOnly: false, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    //Delete the refresh token
    await User.findOneAndUpdate({ _id: foundEmployee?._id }, { refreshToken: '' });
    //Clear cookie
    res.clearCookie('jwt', { httpOnly: false, sameSite: 'None', secure: true });//secure: true might not work for Thunder Client
    res.sendStatus(204);
};

const handleConfirmEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if(!token) return res.status(404).json({'message':'Email token not found'});
        const cookies = req.cookies;
        if(!cookies?.cnfm) return res.status(400).json({message: 'Invalid session!'});
        const email = cookies.cnfm;
        //Use the token and email to find the Employee
        const employee = await Employee.findOne({ emailToken: token, emailAddress: email }).exec();
        if(!employee || (new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime())){
            if(!email || (new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime())){
                const payload = {
                    name: employee.firstName,
                    email: employee.emailAddress,
                    subject: "Confirm Your Email",
                    messageText: emailConfirmationMessage(),
                    file: "ConfirmEmail.html"
                }
                
                const result = emailSlave(payload);
                if(!result?.isSuccess) return res.status(400).json({message: 'Email confirmation failed. Please try again.'});
                //set the Employee token and the expiry time
                employee.emailToken = result?.token;
                employee.tokenExpiryTime = addHours(Date.now(), 2);
                await employee.save();
                res.cookie('cnfm', email, { httpOnly: false, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            } else {
                res.status(404).json({message:'Email verification failed. Invalid token'});
            }
        } else {
            //update the Employee
            employee.emailToken = null;
            employee.isEmailConfirmed = true;
            //save the changes
            await employee.save();
            res.clearCookie('cnfm', { httpOnly: false, sameSite: 'None' });
            res.status(200).json({message: 'Email successfully confirm. Please login.'});
        }
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const handleResetPassword = async (req, res) => {
    const { emailAddress } = req.body;
    try {
            const employee = await Employee.findOne({ emailAddress: emailAddress });
            if(!employee) return res.status(404).json({'message':`No employee found with the email: ${emailAddress}`});
            const payload = {
                name: employee.firstName,
                email: employee.emailAddress,
                subject: "Reset Your Password",
                messageText: resetPasswordMessage(),
                file: "ConfirmEmail.html"
            }
            
            const result = emailSlave(payload);
            if(!result?.isSuccess) return res.status(400).json({message: 'Password reset failed. Please try again.'});
            //set the employee token and the expiry time
            employee.emailToken = result?.token;
            employee.tokenExpiryTime = addHours(Date.now(), 2);
            await employee.save();
            res.cookie('cnfm', emailAddress, { httpOnly: false, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
            res.status(200).json({message:'Please check your email for a One-Time-Password to change your password.'});
        } catch (error) {
            res.status(500).json({message:error.message});
        }
};

const handleChangeForgotPass = async (req, res) => {
    const { 
        newPassword, 
        confirmNewPassword,
        token 
    } = req.body;

    if(newPassword !== confirmNewPassword)
        return res.status(400).json({message:'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({message:'Password must have at least, a lowercase, an uppercase, a digit and a special character'});

    const cookies = req.cookies;
    const email = cookies.cnfm;
    try {
        const employee = await Employee.findOne({ emailToken: token, emailAddress: email });
        if(!employee || (new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime())){
            if(!email || (new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime())){
                const payload = {
                    name: employee.firstName,
                    email: employee.emailAddress,
                    subject: "Reset Your Password",
                    messageText: resetPasswordMessage(),
                    file: "ConfirmEmail.html"
                }
                
                const result = emailSlave(payload);
                if(!result?.isSuccess) return res.status(400).json({message: 'Password change failed. Please try again.'});
                //set the user token and the expiry time
                employee.emailToken = result?.token;
                employee.tokenExpiryTime = addHours(Date.now(), 2);
                res.cookie('cnfm', email, { httpOnly: false, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
                await employee.save();
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            } else {
                res.status(404).json({message:'User not found. Invalid token'});
            }

        } else {
            employee.emailToken = null;
            //hash the new Password
            const hashedPwd = await bcrypt.hash(newPassword, 10);
            employee.password = hashedPwd;
            //save the changes
            await employee.save();
            res.clearCookie('cnfm', { httpOnly: false, sameSite: 'None', secure: true });
            res.status(200).json({message: 'Password successfully changed'});
        }
    } catch (error) {
       res.status(500).json({message:error.message}); 
    }
};

const handleChangePass = async (req, res) => {
    const userId = req.params.userId;
    const { 
            newPassword, 
            confirmNewPassword 
        } = req.body;
    if(newPassword !== confirmNewPassword)
        return res.status(400).json({'message':'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character'});
    
    try {
        const employee = await Employee.findOne({ _id: userId });
        if(employee){
            const hashedPwd = await bcrypt.hash(newPassword, 10);
            employee.password = hashedPwd;
            //save the changes
            await employee.save();
            res.status(200).json({'message':'Password successfully changed'});
        } else {
            res.status(404).json({'message':`No user found with Id: ${userId}`});
        }
    } catch (error) {
        res.status(500).json({'message':error.message});
    }
}

module.exports = {
    handleLogin,
    handleLogout,
    handleConfirmEmail,
    handleResetPassword,
    handleChangeForgotPass,
    handleChangePass
}