const User = require('../models/User');
const bcrypt = require('bcrypt');
const ROLES = require('../config/roles');
const { emailConfirmationMessage, resetPasswordMessage } = require('../helpers/helperFs');
const isValidPassword = require('../utils/isValidPassword');
const { emailSlave } = require('../helpers/emailSlave');

const getUserProfile = (req, res) => {
    console.log(req.cookies)
    res.status(200).json({message: 'It works'});
};

const create = async (req, res) => {
    const { 
        name,
        email,
        password,
    } = req.body;

    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        
        //add new Employee
        const newUser = {
            "name": name,
            "email": email,
            "role": ROLES.User,
            "password": hashedPwd
        }
        await User.create(newUser);

        const payload = {
            name: name,
            email: email,
            subject: "Confirm Your Email",
            messageText: emailConfirmationMessage(),
            file: "ConfirmEmail.html"
        } 
        emailSlave(payload);
        res.cookie('cnfm', email, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
        res.status(201).json({ 'message': 'User Registration successful' });
    } catch (error) {
        res.status(500).json(({ 'message': error.message }));
    }
};

const updateName = async (req, res) => {
    const {
        name
    } = req.body;

    if(!name) return res.status(400).json({ 'message': 'Name is a required field.' });
    const id = req.params.id;

    try {
        const userToUpdate = await User.findOne({ _id: id }).exec();
        if(userToUpdate){
            userToUpdate.name = name;

            await userToUpdate.save();
            res.status(200).json({ 'message': 'Name updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No user with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ 'message': 'Email and password are required.'});

    const foundUser = await User.findOne({ email: email }).exec();
    if(!foundUser) return res.status(404).json({'message':`No user found with email: ${email}`});
    if(!foundUser.isEmailConfirmed) {
        try {
            const payload = {
                name: foundUser.name,
                email: foundUser.email,
                subject: "Confirm Your Email",
                messageText: emailConfirmationMessage(),
                file: "ConfirmEmail.html"
            }
            
            const result = emailSlave(payload);
            //set the user token and the expiry time
            if(!result?.isSuccess) return res.status(400).json({message: 'Login failed. Please try again.'});
            foundUser.emailToken = result?.token;
            foundUser.tokenExpiryTime = addHours(Date.now(), 2);
            await foundUser.save();
            res.cookie('cnfm', email, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
            return res.status(400).json(
                {
                    message:'Confirm your account before attempting to log in. Please check your mail.',
                    toConfirmEmail: true,
                    email: emailAddress
                })
        } catch (error) {
            res.status(500).json({'message':error.message });
        }
    }

    //check password
    const match = await bcrypt.compare(password, foundUser.password);
    if(match){
        const roles = [foundUser.role];
        //create JWT
        const accessToken = jwt.sign(
            { 
                "UserInfo": {
                    "id": foundUser._id,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { "id": foundUser._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        //set refresh token for user
        foundUser.refreshToken = refreshToken;
        foundUser.lastLogin = new Date();
        foundUser.save();
        //set the refresh token in cookie
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
        res.status(200).json({ accessToken });
    } else {
        res.status(400).json({'message':'Password is not correct.'});
    }
};

const logout = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken: refreshToken });
    if(!foundUser){
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    //Delete the refresh token
    await User.findOneAndUpdate({ _id: foundUser?._id }, { refreshToken: '' });
    //Clear cookie
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });//secure: true might not work for Thunder Client
    res.sendStatus(204);
};

const confirmEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const cookies = req.cookies;
        if(!cookies?.cnfm) return res.status(400).json({message: 'Invalid session!'});
    const email = cookies.cnfm;
        if(!token) return res.status(404).json({'message':'Email token not found'});
        //Use the token to find the Employee
        const user = await User.findOne({ emailToken: token, email: email }).exec();
        if(user){
            if(new Date(user.tokenExpiryTime).getTime() < new Date().getTime()){
                const payload = {
                    name: user.name,
                    email: user.email,
                    subject: "Confirm Your Email",
                    messageText: emailConfirmationMessage(),
                    file: "ConfirmEmail.html"
                }
                
                const result = emailSlave(payload);
                if(!result?.isSuccess) return res.status(400).json({message: 'Email confirmation failed. Please try again.'});
                //set the Employee token and the expiry time
                user.emailToken = result?.token;
                user.tokenExpiryTime = addHours(Date.now(), 2);
                await user.save();
                res.cookie('cnfm', email, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            }
            //update the Employee
            user.emailToken = null;
            user.isEmailConfirmed = true;
            //save the changes
            await user.save();
            res.clearCookie('cnfm', { httpOnly: true, sameSite: 'None', secure: true });
            res.status(200).json({id: employee._id});
        } else {
            res.status(404).json({message:'Email verification failed. Invalid token'});
        }
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const resetPassword = async (req, res) => {
    const { email } = req.body;
    try {
            const user = await User.findOne({ email: email });
            if(!user) return res.status(404).json({'message':`No user found with the email: ${email}`});
            const payload = {
                name: user.name,
                email: user.email,
                subject: "Reset Your Password",
                messageText: resetPasswordMessage(),
                file: "ConfirmEmail.html"
            }
            
            const result = emailSlave(payload);
            if(!result?.isSuccess) return res.status(400).json({message: 'Password reset failed. Please try again'});
            //set the user token and the expiry time
            user.emailToken = result?.token;
            user.tokenExpiryTime = addHours(Date.now(), 2);
            await user.save();
            res.cookie('cnfm', email, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
            res.status(200).json({message:'Please check your email for a One-Time-Password to change your password.', email: email});
        } catch (error) {
            res.status(500).json({message:error.message});
        }
};

const changeForgotPass = async (req, res) => {
    const { 
        newPassword, 
        confirmNewPassword,
        token 
    } = req.body;

    const cookies = req.cookies;
    if(!cookies?.cnfm) return res.status(400).json({message: 'Invalid session!'});
    const email = cookies.cnfm;

    if(newPassword !== confirmNewPassword)
        return res.status(400).json({message:'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({message:'Password must have at least, a lowercase, an uppercase, a digit and a special character'});

    try {
        const user = await User.findOne({ emailToken: token, email: email });
        if(user){
                if(new Date(user.tokenExpiryTime).getTime() < new Date().getTime()){
                    const payload = {
                        name: user.name,
                        email: user.email,
                        subject: "Reset Your Password",
                        messageText: resetPasswordMessage(),
                        file: "ConfirmEmail.html"
                    }
                    
                    const result = emailSlave(payload);
                    if(!result?.isSuccess) return res.status(400).json({message:'Could not change password. Please try again.'});
                    //set the user token and the expiry time
                    user.emailToken = result?.token;
                    user.tokenExpiryTime = addHours(Date.now(), 2);
                    await user.save();
                    res.cookie('cnfm', email, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 1000 });//secure: true might not work for Thunder Client
                    res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
                }
                user.emailToken = null;
                //hash the new Password
                const hashedPwd = await bcrypt.hash(newPassword, 10);
                user.password = hashedPwd;
                //save the changes
                await user.save();
                res.clearCookie('cnfm', { httpOnly: true, sameSite: 'None', secure: true });
                res.status(200).json({_id: user._id});
            } else {
                res.status(404).json({message:'User not found. Invalid token'});
            }
    } catch (error) {
       res.status(500).json({message:error.message, toConfirmEmail: false}); 
    }
};

const changePass = async (req, res) => {
    const userId = req.params.userId;
    const { 
            newPassword, 
            confirmNewPassword 
        } = req.body;
    if(newPassword !== confirmNewPassword)
        return res.status(400).json({'message':'Password and confirm password must match.'});
    if(!isValidPassword(newPassword)) return res.status(400).json({'message':'Password must have at least, a lowercase, an uppercase, a digit and a special character'});
    
    try {
        const user = await User.findOne({ _id: userId });
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
}

module.exports = {
    getUserProfile,
    create,
    updateName,
    login,
    logout,
    confirmEmail,
    resetPassword,
    changeForgotPass,
    changePass
};