const randomNumBetweenRange = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};

const MAX_FILE_SIZE = 819200;

const allowedFileExt = ['png', 'jpg', 'jpeg'];

const isNotANumber = (str) => isNaN(Number(str));

const toNumber = (str) =>  Number(str);

const emailConfirmationMessage = () => {
    return `
    We are pleased to welcome you to Treasure Kitchen.
    Please use the One-Time Password below to confirm your email.
    No action is required if you feel you got this message in error.
    `;
};

const resetPasswordMessage = () => {
    return `
    You requested for a password reset.
    Please use the One-Time Password below to complete the process
    No action is required if you did not initiate the action.
    `;
};

const range = {
    "MIN": 12345,
    "MAX": 99999
}

module.exports = {
    randomNumBetweenRange,
    emailConfirmationMessage,
    resetPasswordMessage,
    range,
    MAX_FILE_SIZE,
    allowedFileExt,
    isNotANumber,
    toNumber
};