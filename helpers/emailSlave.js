const path = require('path');
const { randomNumBetweenRange, range, confirmReservationMessage, capitalizeFirstWord, currency } = require('./helperFs');
const fsPromises = require('fs').promises;
const { sendMail } = require('../utils/sendMail');
const { format } = require('date-fns');

const sendOrderNotification = async({ name, price, date, orderId, email, subject }) => {
    try {
        const filePath = path.join(__dirname, '..', 'views', 'OrderDetails.html');
        const template = await fsPromises.readFile(filePath, 'utf8');
        const message = template
                        .replace("{{firstname}}", `Hello ${capitalizeFirstWord(name)},`)
                        .replace("{{total_price}}", `${currency.naira}${new Intl.NumberFormat().format(price)}`)
                        .replace("{{order_date}}", format(new Date(date), 'yyyy-MM-dd-HH:mm'))
                        .replace("{{order_id}}", orderId);
        const payLoad = { 
            recipientEmail: email, 
            recipientName: name, 
            subject: subject, 
            html: message
        };
        sendMail(payLoad);
    } catch (error) {
        throw error;
    }
}

const sendReservationNotification = async({ name, email, subject, cancelAtDate, link }) => {
    try {
        const filePath = path.join(__dirname, '..', 'views', 'Notification.html');
        const template = await fsPromises.readFile(filePath, 'utf8');
        const message = template
                        .replace("{{greetings}}", `Hello ${capitalizeFirstWord(name)},`)
                        .replace("{{message}}", confirmReservationMessage(cancelAtDate))
                        .replace("{{order_track_link}}", link)
                        .replace("{{year}}", (new Date()).getFullYear());
        const payLoad = { 
            recipientEmail: email, 
            recipientName: name, 
            subject: subject, 
            html: message
        };
        sendMail(payLoad);
    } catch (error) {
        throw error;
    }
}

const sendConfirmationEmail = async ({ name, email, subject, messageText, file, link }) => {
    try {
            const filePath = path.join(__dirname, '..', 'views', file);
            let template = await fsPromises.readFile(filePath, 'utf8');
            let message = template
                            .replace("{{greetings}}", capitalizeFirstWord(name))
                            .replace("{{message}}", messageText)
                            .replace("{{email_link}}", link)
                            .replace("{{btn_name}}", btn)
                            .replace("{{year}}", (new Date()).getFullYear());
            const payLoad = { 
                recipientEmail: email, 
                recipientName: name, 
                subject: subject, 
                html: message
            };
            sendMail(payLoad);    
    } catch (error) {
        throw error;
    }
}

const emailSlave = async ({ name, email, subject, messageText, file }) => {
    try {
        const filePath = path.join(__dirname, '..', 'views', file);
            const emailToken = randomNumBetweenRange(range.MIN, range.MAX);
            //TODO: Check if path exists
            const template = await fsPromises.readFile(filePath, 'utf8');
            const message = template
                            .replace("{{greetings}}", `Welcome ${name},`)
                            .replace("{{message}}", messageText)
                            .replace("{{OTP}}", emailToken)
                            .replace("{{year}}", (new Date()).getFullYear());
            
            //send verification OTP to user
            const payLoad = { 
                recipientEmail: email, 
                recipientName: name, 
                subject: subject, 
                html: message
            };
            sendMail(payLoad);
            return { isSuccess: true, token: emailToken };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    emailSlave,
    sendOrderNotification,
    sendConfirmationEmail,
    sendReservationNotification
}