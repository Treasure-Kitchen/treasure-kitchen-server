const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const isValidPassword = require('../utils/isValidPassword');
const { addHours } = require('date-fns');
const { emailConfirmationMessage, resetPasswordMessage } = require('../helpers/helperFs');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendConfirmationEmail } = require('../helpers/emailSlave');
const crypto = require('crypto');
const User = require('../models/User');

const handleLogin = async (req, res) => {
    const { emailAddress, password } = req.body;
    const origin = req.headers.origin;
    if(!emailAddress || !password) return res.status(400).json({ 'message': 'Email and password are required.'});

    try {
        const foundEmployee = await Employee.findOne({ emailAddress: emailAddress }).populate('role').exec();
        if(!foundEmployee) return res.status(404).json({'message':`No user found with email: ${emailAddress}`});
        if(foundEmployee.isTerminated) return res.status(403).json({message: 'You have been terminated. Your access has been revoked'})
        if(!foundEmployee.isEmailConfirmed) {
            const emailToken = crypto.randomBytes(64).toString("hex");
            const link = `${origin}/verify-email?token=${emailToken}`;
            const payload = {
                name: foundEmployee.firstName,
                email: foundEmployee.emailAddress,
                subject: "Confirm Email",
                messageText: emailConfirmationMessage(),
                file: "ConfirmEmail.html",
                link: link
            };
            //Send confirmation email
            await sendConfirmationEmail(payload);
            foundEmployee.emailToken = emailToken;
            foundEmployee.tokenExpiryTime = addHours(new Date(), 2);
            await foundEmployee.save();
            return res.status(400).json({message:'Confirm your account before attempting to log in. Please check your mail.'})
        } else {
            const match = await bcrypt.compare(password, foundEmployee.password);
            if(match){
                //create JWT
                const accessToken = generateAccessToken(foundEmployee.role, foundEmployee._id, '1d');
                const refreshToken = generateRefreshToken(foundEmployee._id, '3d');
                //set refresh token for user
                foundEmployee.refreshToken = refreshToken;
                foundEmployee.lastLogin = new Date();
                foundEmployee.save();
                //set the refresh token in cookie
                const user = {
                    id: foundEmployee._id,
                    role: foundEmployee.role.role,
                };
                res.cookie('jwt', refreshToken, { httpOnly: false, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
                res.status(200).json({ accessToken, user });
            } else {
                res.status(400).json({'message':'Password is not correct.'});
            }
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    try {
        const foundEmployee = await Employee.findOne({ refreshToken: refreshToken }).exec();
        if(!foundEmployee){
            res.clearCookie('jwt', { httpOnly: false, sameSite: 'None', secure: true });
            const user = await User.findOne({ refreshToken: refreshToken }).exec();
            if(user){
                user.refreshToken = '';
                await user.save();
            }
        } else {
            //Delete the refresh token for employee
            await Employee.findOneAndUpdate({ _id: foundEmployee?._id }, { refreshToken: '' });  
        }
        res.clearCookie('jwt', { httpOnly: false, sameSite: 'None', secure: true });//secure: true might not work for Thunder Client
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const handleConfirmEmail = async (req, res) => {
    const origin = req.headers.origin;
    try {
        const { token } = req.body;
        if(!token) return res.status(404).json({'message':'Email token not found'});
        //Use the token to find the User
        const employee = await Employee.findOne({ emailToken: token }).exec();
        if(employee){
            if(new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime()){
                const emailToken = crypto.randomBytes(64).toString("hex");
                const link = `${origin}/verify-email?token=${emailToken}`;
                const payload = {
                    name: capitalizeFirstWord(employee.firstName),
                    email: employee.emailAddress,
                    subject: "Confirm Email",
                    messageText: emailConfirmationMessage(),
                    file: "ConfirmEmail.html",
                    link: link
                };
                //Send confirmation email again
                await sendConfirmationEmail(payload);
                employee.emailToken = emailToken;
                employee.tokenExpiryTime = addHours(Date.now(), 2);
                await employee.save();
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            } else {
                //update the Employee
                employee.emailToken = null;
                employee.isEmailConfirmed = true;
                //save the changes
                await employee.save();
                res.status(200).json({message: 'Email successfully confirmed. Please proceed to login.'});
            }
            
        } else {
            res.status(404).json({message:'Email verification failed. Invalid token'});
        }
    } catch(error) {
        res.status(500).json({message: error.message});
    }
};

const handleResetPassword = async (req, res) => {
    const { emailAddress } = req.body;
    const origin = req.headers.origin;
    try {
            const employee = await Employee.findOne({ emailAddress: emailAddress });
            if(!employee) return res.status(404).json({'message':`No employee found with the email: ${emailAddress}`});
            const emailToken = crypto.randomBytes(64).toString("hex");
            const link = `${origin}/reset-password?token=${emailToken}`;
            const payload = {
                name: employee.firstName,
                email: employee.emailAddress,
                subject: "Reset Password",
                messageText: resetPasswordMessage(),
                file: "ConfirmEmail.html",
                link: link
            };
            await sendConfirmationEmail(payload);
            employee.emailToken = emailToken;
            employee.tokenExpiryTime = addHours(new Date(), 2);
            await employee.save();
            res.status(200).json({message:'Please check your email to change your password.'});
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
    if(!isValidPassword(newPassword)) 
        return res.status(400).json({message:'Password must have at least, a lowercase, an uppercase, a digit and a special character'});
    try {
        const employee = await Employee.findOne({ emailToken: token }).exec();
        if(employee){
            if(new Date(employee?.tokenExpiryTime).getTime() < new Date().getTime()){
                const emailToken = crypto.randomBytes(64).toString("hex");
                const link = `${origin}/reset-password?token=${emailToken}`;
                const payload = {
                    name: capitalizeFirstWord(employee.firstName),
                    email: employee.emailAddress,
                    subject: "Reset Password",
                    messageText: resetPasswordMessage(),
                    file: "ConfirmEmail.html",
                    link: link
                };
                
                await sendConfirmationEmail(payload);
                employee.emailToken = emailToken;
                employee.tokenExpiryTime = addHours(new Date(), 2); 
                await employee.save(); 
                res.status(400).json({message:'Token expired! Please verify with the new link sent to your email'});
            } else {
                employee.emailToken = null;
                //hash the new Password
                const hashedPwd = await bcrypt.hash(newPassword, 10);
                employee.password = hashedPwd;
                //save the changes
                await employee.save();
                res.status(200).json({message: 'Password successfully changed. Please login with your new password.'});
            }

        } else {
            res.status(404).json({message:'Employee not found. Invalid token'});  
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
        const employee = await Employee.findOne({ _id: userId }).exec();
        if(employee){
            const hashedPwd = await bcrypt.hash(newPassword, 10);
            employee.password = hashedPwd;
            //save the changes
            await employee.save();
            res.status(200).json({'message':'Password successfully changed'});
        } else {
            res.status(404).json({'message':`No Employee found with Id: ${userId}`});
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