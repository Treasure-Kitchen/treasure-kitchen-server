const Employee = require('../models/Employee');
const fsPromises = require('fs').promises;
const path = require('path');
const { sendMail } = require('../utils/sendMail');
const bcrypt = require('bcrypt');
const isValidPassword = require('../utils/isValidPassword');
const { addHours } = require('date-fns');
const jwt = require('jsonwebtoken');
const { 
    randomNumBetweenRange,
    emailConfirmationMessage,
    resetPasswordMessage,
    range
} = require('../helpers/helperFs')

const handleLogin = async (req, res) => {
    const { emailAddress, password } = req.body;
    if(!emailAddress || !password) return res.status(400).json({ 'message': 'Email and password are required.', 'toConfirmEmail': false});

    const foundEmployee = await Employee.findOne({ emailAddress: emailAddress }).exec();
    if(!foundEmployee) return res.status(404).json({'message':`No user found with email: ${emailAddress}`, 'toConfirmEmail': false});
    if(foundEmployee.isTerminated) return res.status(403).json({message: 'You have been terminated. Your access have been revoked', toConfirmEmail: false})
    if(!foundEmployee.isEmailConfirmed) {
        try {
            const filePath = path.join(__dirname, '..', 'views', 'ConfirmEmail.html');
            const emailToken = randomNumBetweenRange(range.MIN, range.MAX);
            //TODO: Check if path exists
            const template = await fsPromises.readFile(filePath, 'utf8');
            const message = template
                            .replace("{{greetings}}", `Welcome ${foundEmployee.firstName}`)
                            .replace("{{message}}", emailConfirmationMessage())
                            .replace("{{OTP}}", emailToken)
                            .replace("{{year}}", (new Date()).getFullYear());
            
            //send verification OTP to user
            const payLoad = { 
                recipientEmail: foundEmployee.emailAddress, 
                recipientName: foundEmployee.firstName, 
                subject: "Confirm Your Email", 
                html: message
            };
            sendMail(payLoad);
            //set the user token and the expiry time
            foundEmployee.emailToken = emailToken;
            foundEmployee.tokenExpiryTime = addHours(Date.now(), 2);
            await foundEmployee.save();
            return res.status(400).json(
                {
                    message:'Confirm your account before attempting to log in. Please check your mail.',
                    toConfirmEmail: true,
                    email: emailAddress
                })
        } catch (error) {
            res.status(500).json({'message':error.message, 'toConfirmEmail': false });
        }
    }

    //check password
    const match = await bcrypt.compare(password, foundEmployee.password);
    if(match){
        const roles = [foundEmployee.role];
        //create JWT
        const accessToken = jwt.sign(
            { 
                "UserInfo": {
                    "id": foundEmployee._id,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { "id": foundEmployee._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        //set refresh token for user
        foundEmployee.refreshToken = refreshToken;
        foundEmployee.save();
        //set the refresh token in cookie
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });//secure: true might not work for Thunder Client
        res.status(200).json({ accessToken });
    } else {
        res.status(400).json({'message':'Password is not correct.', 'toConfirmEmail': false});
    }
};

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundEmployee = await Employee.findOne({ refreshToken: refreshToken });
    if(!foundEmployee){
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    //Delete the refresh token
    await User.findOneAndUpdate({ _id: foundEmployee?._id }, { refreshToken: '' });
    //Clear cookie
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });//secure: true might not work for Thunder Client
    res.sendStatus(204);
};

const handleConfirmEmail = async (req, res) => {
    try {
        const { token, email } = req.body;
        if(!token) return res.status(404).json({'message':'Email token not found'});
        //Use the token to find the Employee
        const employee = await Employee.findOne({ emailToken: token, emailAddress: email }).exec();
        if(employee){
            if(new Date(employee.tokenExpiryTime).getTime() < new Date().getTime()){
                const filePath = path.join(__dirname, '..', 'views', 'ConfirmEmail.html');
                //TODO: check if the file exists
                const emailToken = randomNumBetweenRange(range.MIN, range.MAX);

                const template = await fsPromises.readFile(filePath, 'utf8');
                const message = template
                            .replace("{{greetings}}", `Welcome ${foundEmployee.firstName}`)
                            .replace("{{message}}", emailConfirmationMessage())
                            .replace("{{OTP}}", emailToken)
                            .replace("{{year}}", (new Date()).getFullYear());
            
                //send verification OTP to user
                const payLoad = { 
                    recipientEmail: employee.emailAddress, 
                    recipientName: employee.firstName, 
                    subject: "Confirm Your Email", 
                    html: message
                };
                sendMail(payLoad);
                //set the Employee token and the expiry time
                employee.emailToken = emailToken;
                employee.tokenExpiryTime = addHours(Date.now(), 2);
                await employee.save();
                res.status(400).json({message:'Token expired! Please verify with the new token sent to your email'});
            }
            //update the Employee
            employee.emailToken = null;
            employee.isEmailConfirmed = true;
            //save the changes
            await employee.save();
            res.status(200).json({id: employee._id});
        } else {
            res.status(404).json({message:'Email verification failed. Invalid token'});
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
            const filePath = path.join(__dirname, '..', 'views', 'ConfirmEmail.html');
            const emailToken = randomNumBetweenRange(range.MIN, range.MAX);
            //TODO: check if file exists
            const template = await fsPromises.readFile(filePath, 'utf8');
            const message = template
                        .replace("{{greetings}}", `Hello ${employee.firstName}`)
                        .replace("{{message}}", resetPasswordMessage())
                        .replace("{{OTP}}", emailToken)
                        .replace("{{year}}", (new Date()).getFullYear());
            //send verification link to employee
            const payLoad = { 
                recipientEmail: employee.emailAddress, 
                recipientName: employee.firstName, 
                subject: "Reset Your Password",
                html: message
            };
            sendMail(payLoad);
            //set the employee token and the expiry time
            employee.emailToken = emailToken;
            employee.tokenExpiryTime = addHours(Date.now(), 2);
            await employee.save();
            res.status(200).json({message:'Please check your email for a One-Time-Password to change your password.', email: emailAddress});
        } catch (error) {
            res.status(500).json({message:error.message});
        }
};

const handleChangeForgotPass = async (req, res) => {
    const { 
        newPassword, 
        confirmNewPassword,
        email,
        token 
    } = req.body;

    if(newPassword !== confirmNewPassword)
        return res.status(400).json({message:'Password and confirm password must match.', toConfirmEmail: false});
    if(!isValidPassword(newPassword)) return res.status(400).json({
        message:'Password must have at least, a lowercase, an uppercase, a digit and a special character',
        toConfirmEmail: false
    });

    try {
        const employee = await Employee.findOne({ emailToken: token, emailAddress: email });
        if(employee){
                if(new Date(employee.tokenExpiryTime).getTime() < new Date().getTime()){
                    const filePath = path.join(__dirname, '..', 'views', 'ConfirmEmail.html');
                    const emailToken = randomNumBetweenRange(range.MIN, range.MAX);
                    //TODO: check if file exists
                    const template = await fsPromises.readFile(filePath, 'utf8');
                    const message = template
                                .replace("{{greetings}}", `Hello ${employee.firstName}`)
                                .replace("{{message}}", resetPasswordMessage())
                                .replace("{{OTP}}", emailToken)
                                .replace("{{year}}", (new Date()).getFullYear());
                    //send verification link to employee
                    const payLoad = { 
                        recipientEmail: employee.emailAddress, 
                        recipientName: employee.firstName, 
                        subject: "Reset Your Password",
                        html: message
                    };
                    sendMail(payLoad);
                    //set the user token and the expiry time
                    employee.emailToken = emailToken;
                    employee.tokenExpiryTime = addHours(Date.now(), 2);
                    await employee.save();
                    res.status(400).json({message:'Token expired! Please verify with the new token sent to your email', toConfirmEmail: true});
                }
                employee.emailToken = null;
                //hash the new Password
                const hashedPwd = await bcrypt.hash(newPassword, 10);
                employee.password = hashedPwd;
                //save the changes
                await employee.save();
                res.status(200).json({_id: employee._id});
            } else {
                res.status(404).json({message:'User not found. Invalid token',toConfirmEmail: false});
            }
    } catch (error) {
       res.status(500).json({message:error.message, toConfirmEmail: false}); 
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