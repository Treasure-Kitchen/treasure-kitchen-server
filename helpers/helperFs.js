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
    "MIN": 123456,
    "MAX": 999999
}

const range2 = {
    "MIN": 12345678,
    "MAX": 99999999
}

const processPaymentStatus = (order, amountPaid) => {
    //if order price minus amount paid is 0: paid 
    //if order price minus amount paid is greater than zero but less than the price: partial
    //if order price minus the amount paid is less than zero: over paid
    const status = order.price - amountPaid === 0 ? 
                        paymentStatuses.Yes :
                        (order.price - amountPaid > 0 && amountPaid < order.price) ?
                        paymentStatuses.Partial : paymentStatuses.OverPaid;
    return status
};

const validDateRange = (minDate, maxDate) => {
    return new Date(maxDate).getTime() > new Date(minDate).getTime();
};
 
const maximumDate = new Date('9999-12-31');
const epochDate = new Date(0);
const minimumDate =  new Date('0001-01-01');

module.exports = {
    randomNumBetweenRange,
    emailConfirmationMessage,
    resetPasswordMessage,
    range,
    range2,
    MAX_FILE_SIZE,
    allowedFileExt,
    isNotANumber,
    toNumber,
    processPaymentStatus,
    validDateRange,
    maximumDate,
    minimumDate,
    epochDate
};