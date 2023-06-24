const path = require('path');
const { randomNumBetweenRange } = require('./helperFs');
const fsPromises = require('fs').promises;


const emailSlave = async ({ name, email, subject, messageText, file }) => {
    try {
        const filePath = path.join(__dirname, '..', 'views', file);
            const emailToken = randomNumBetweenRange(range.MIN, range.MAX);
            //TODO: Check if path exists
            const template = await fsPromises.readFile(filePath, 'utf8');
            const message = template
                            .replace("{{greetings}}", `Welcome ${name}`)
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
            //name, email, subject, message, filename: ConfirmEmail.html
            return { isSuccess: true, token: emailToken };
    } catch (error) {
        return { isSuccess: false, token: null };
    }
};

module.exports = {
    emailSlave
}