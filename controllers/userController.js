const { sendConfirmationEmail } = require('../helpers/emailSlave');
const { emailConfirmationMessage, capitalizeFirstLetters, capitalizeFirstWord, resetPasswordMessage, TWO } = require('../helpers/helperFs');
const Role = require('../models/Role');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ROLES = require('../config/roles');
const isValidPassword = require('../utils/isValidPassword');
const { addHours } = require('date-fns');

const create = async(req, res) => {
    const origin = req.headers.origin;
    const {
        name,
        emailAddress,
        password,
        confirmPassword
    } = req.body;
    try {
            if(!name) return res.status(400).json({ 'message': 'Name is required'});
            if(!(name.split(' ').length > 1)) return res.status(400).json({message: 'You must emter your first and last names seaparated by a whitespace.'});
            if(!password) return res.status(400).json({ 'message': 'Password is required'});
            if(password !== confirmPassword) return res.status(400).json({ 'message': 'Password and Confirm Password must match' });
            if(!isValidPassword(password)) return res.status(400).json({ 'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character' });
            if(!emailAddress) return res.status(400).json({message: 'Email address is required'});
            if((await User.exists({ email: emailAddress }).exec())) 
                return res.status(409).json({message: `There's already a resgistered user with the email: ${emailAddress}`});
            const hashedPwd = await bcrypt.hash(password, 10);
            const roleFromDb = await Role.findOne({ role: ROLES.User }).exec();
            if(!roleFromDb) return res.status(404).json({message: `${ROLES.User} role does not exist.`});
            const emailToken = crypto.randomBytes(64).toString("hex");
            //Initialize new User
            const user = new User({
                displayName: capitalizeFirstLetters(name),
                email: emailAddress,
                role: roleFromDb._id,
                password: hashedPwd,
                emailToken: emailToken,
                tokenExpiryTime: addHours(new Date(), 2)
            });
            const link = `${origin}/verify-user-email?token=${emailToken}`;
            //Send confirmation email
            const payload = {
                name: capitalizeFirstWord(user.displayName),
                email: user.email,
                subject: "Confirm Email",
                messageText: emailConfirmationMessage(),
                file: "ConfirmEmail.html",
                link: link
            }
            await sendConfirmationEmail(payload);
            //Save
            await user.save();
            res.status(201).json({ 'message': 'User Registration successful. Please confirm your email.' });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getUserProfile = async (req, res) => {
    const userId = req.params.id;
    try {
        var user = await User.findOne({ _id: userId}).select('id displayName email photo role createdAt').exec();
        if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
        const accessToken = generateAccessToken(user.role, user._id, '1d');
        res.status(200).json({accessToken, user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const login = async(req, res) => {
    const { emailAddress, password } = req.body;
    const origin = req.headers.origin;
    if(!emailAddress || !password) return res.status(400).json({ 'message': 'Email and password are required.'});

    try {
        const userFromDb = await User.findOne({ email: emailAddress }).populate('role').exec();
        if(!userFromDb) return res.status(404).json({'message':`No user found with the email: ${emailAddress}`});
        if(!userFromDb.isEmailConfirmed) {
            if(new Date(userFromDb?.tokenExpiryTime).getTime() < new Date().getTime()){
                const emailToken = crypto.randomBytes(64).toString("hex");
                const link = `${origin}/verify-user-email?token=${emailToken}`;
                const payload = {
                    name: capitalizeFirstWord(userFromDb.displayName),
                    email: userFromDb.email,
                    subject: "Confirm Email",
                    messageText: emailConfirmationMessage(),
                    file: "ConfirmEmail.html",
                    link: link
                };
                //Save confirmation email
                await sendConfirmationEmail(payload);
                userFromDb.emailToken = emailToken;
                userFromDb.tokenExpiryTime = addHours(new Date(), 2);
                await userFromDb.save();
            }
            return res.status(400).json({message:'Confirm your account before attempting to log in. Please check your mail.'})
        } else {
            //check password
            const match = await bcrypt.compare(password, userFromDb.password);
            if(match){
                //create JWT
                const accessToken = generateAccessToken(userFromDb.role, userFromDb._id, '1d');
                const refreshToken = generateRefreshToken(userFromDb._id, '1d');
                //set refresh token for userFromDb
                userFromDb.refreshToken = refreshToken;
                userFromDb.lastLogin = new Date();
                await userFromDb.save();
                //set the refresh token in cookie
                const user = {
                    id: userFromDb._id,
                    role: userFromDb.role.role
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

const confirmEmail = async (req, res) => {
    const origin = req.headers.origin;
    try {
        const { token } = req.body;
        if(!token) return res.status(404).json({'message':'Email token not found'});
        //Use the token to find the User
        const user = await User.findOne({ emailToken: token }).exec();
        if(user){
            if(new Date(user?.tokenExpiryTime).getTime() < new Date().getTime()){
                const emailToken = crypto.randomBytes(64).toString("hex");
                const link = `${origin}/verify-user-email?token=${emailToken}`;
                const payload = {
                    name: capitalizeFirstWord(user.displayName),
                    email: user.email,
                    subject: "Confirm Email",
                    messageText: emailConfirmationMessage(),
                    file: "ConfirmEmail.html",
                    link: link
                };
                //Save confirmation email
                await sendConfirmationEmail(payload);
                user.emailToken = emailToken;
                user.tokenExpiryTime = addHours(Date.now(), 2);
                await user.save();
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            } else {
                //update the Employee
                user.emailToken = '';
                user.isEmailConfirmed = true;
                //save the changes
                await user.save();
                res.status(200).json({message: 'Email successfully confirmed.'});
            }  
        } else {
            res.status(404).json({message:'Email verification failed. Invalid token'});
        }
    } catch(error) {
        res.status(500).json({message: error.message});
    }
}

const resetPassword = async(req, res) => {
    const { emailAddress } = req.body;
    const origin = req.headers.origin;
    try {
            const user = await User.findOne({ email: emailAddress }).exec();
            if(!user) return res.status(404).json({'message':`No employee found with the email: ${emailAddress}`});
            const emailToken = crypto.randomBytes(64).toString("hex");
            const link = `${origin}/reset-user-password?token=${emailToken}`;
            const payload = {
                name: capitalizeFirstWord(user.displayName),
                email: user.email,
                subject: "Reset Password",
                messageText: resetPasswordMessage(),
                file: "ConfirmEmail.html",
                link: link
            };
            await sendConfirmationEmail(payload);
            user.emailToken = emailToken;
            user.tokenExpiryTime = addHours(new Date(), 2);
            await user.save();
            res.status(200).json({message:'Please check your email to change your password.'});
        } catch (error) {
            res.status(500).json({message:error.message});
        }
};

const changeForgottenPassword = async(req, res) => {
    const origin = req.headers.origin;
    const { 
        newPassword, 
        confirmNewPassword,
        token 
    } = req.body;
    
    if(newPassword !== confirmNewPassword)
        return res.status(400).json({message:'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({message:'Password must have at least, a lowercase, an uppercase, a digit and a special character'});
    try {
        const user = await User.findOne({ emailToken: token }).exec();
        if(user){
            if(new Date(user?.tokenExpiryTime).getTime() < new Date().getTime()){
                const emailToken = crypto.randomBytes(64).toString("hex");
                const link = `${origin}/reset-user-password?token=${emailToken}`;
                const payload = {
                    name: capitalizeFirstWord(user.displayName),
                    email: user.email,
                    subject: "Reset Password",
                    messageText: resetPasswordMessage(),
                    file: "ConfirmEmail.html",
                    link: link
                };
                
                await sendConfirmationEmail(payload);
                user.emailToken = emailToken;
                user.tokenExpiryTime = addHours(new Date(), 2); 
                await user.save(); 
                res.status(400).json({message:'Token expired! Please verify with the new link sent to your email'});
            } else {
                user.emailToken = '';
                //hash the new Password
                const hashedPwd = await bcrypt.hash(newPassword, 10);
                user.password = hashedPwd;
                //save the changes
                await user.save();
                res.status(200).json({message: 'Password successfully changed. Please login with your new password.'});
            }
        } else {
            res.status(404).json({message:'User not found. Invalid token'});  
        }
    } catch (error) {
       res.status(500).json({message:error.message}); 
    }
};

const changePassword = async(req, res) => {
    const userId = req.params.userId;
    const { 
            newPassword, 
            confirmNewPassword 
        } = req.body;
    if(newPassword !== confirmNewPassword)
        return res.status(400).json({'message':'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character'});
    
    try {
        const user = await User.findOne({ _id: userId }).exec();
        if(user){
            const hashedPwd = await bcrypt.hash(newPassword, 10);
            user.password = hashedPwd;
            //save the changes
            await user.save();
            res.status(200).json({'message':'Password successfully changed'});
        } else {
            res.status(404).json({'message':`No user found with Id: ${userId}`});
        }
    } catch (error) {
        res.status(500).json({'message':error.message});
    }
};

const changeName = async(req, res) => {
    const { id } = req.params;
    const {
        name
    } = req.body;
    
    if(!name) return res.status(400).json({message: 'Name is required.'});
    const nameArray = name.split(' ');
    if(!(nameArray.length >= TWO)) return res.status(400).json({message: 'First name and Last name are required.'});
    try {
            const user = await User.findOne({ _id: id }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${id}`});
            //Update
            user.displayName = capitalizeFirstLetters(name);
            await user.save();
            res.status(200).json({message: 'Names successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const ping = async (req, res) => {
    const { id } = req.params;
    try {
            const user = await User.findOne({ _id: id })
                .select('_id displayName email photo createdAt lastLogin role')
                .populate({
                    path: 'role',
                    select: 'name role'
                })
                .exec();
            res.status(200).json(user)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = {
    ping,
    login,
    create,
    changeName,
    confirmEmail,
    resetPassword,
    changePassword,
    getUserProfile,
    changeForgottenPassword
};