const { millisecondsInHour } = require("date-fns");
const { paymentStatuses } = require("../config/statuses");

const randomNumBetweenRange = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};

const MAX_FILE_SIZE = 819200;

const MIN_DURATION = 0.5;

const TWO = 2;

const FIVE = 5;

const FIFTY = 50;

const SIXTY = 60;

const MAX_DURATION = 13;

const anHourInSeconds = () => {
    //================Hours Minutes Seconds
    return (60 * 60 * 1000);
};

const differenceInDate = (minDate, maxDate) => {
    return ((new Date(maxDate)).getTime() - (new Date(minDate)).getTime());
};

const allowedFileExt = ['png', 'jpg', 'jpeg'];

const isNotANumber = (str) => isNaN(Number(str));

const toNumber = (str) =>  Number(str);

const emailConfirmationMessage = () => {
    return `
    We are pleased to welcome you to Treasure Kitchen.
    Please click the button below to confirm your email.
    No action is required if you feel you got this message in error.
    `;
};

const resetPasswordMessage = () => {
    return `
    You requested for a password reset.
    Please click the button below to complete the process
    No action is required if you did not initiate the action.
    `;
};

const confirmReservationMessage = (dateTime) => {
    return `
        We just received your reservation request.
        Please go to your profile and confirm your reservation before ${dateTime}, if you have not done so already.
    `
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
    const status = amountPaid === 0 ?
                        paymentStatuses.NotPaid :
                        order.price - amountPaid === 0 ? 
                        paymentStatuses.Paid :
                        (order.price - amountPaid > 0 && amountPaid < order.price) ?
                        paymentStatuses.Partial :
                        paymentStatuses.OverPaid;
    return status
};

const validDateRange = (minDate, maxDate) => {
    return new Date(maxDate).getTime() > new Date(minDate).getTime();
};

const toMinutes = (num) => {
    return num * SIXTY;
};

const capitalizeFirstWord = (str) => {
    let first = str.split(' ')[0].toLowerCase()
    return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}
  
const capitalizeFirstLetters = (str) => {
    let splitted = str.split(' ');
    let result = "";
    splitted.forEach((word) => {
        result += `${word.charAt(0).toUpperCase()}${word.slice(1)} `;
    });

    return result.trim();
};

const isReservationAConflict = (table, dateTime, duration) => {
    const reservations = table.reservations.filter((res) =>{
        //Get the reservation dateTime in milliseconds
        const existingResTime = (new Date(res.dateTime)).getTime();
        //Get the reservation end time in milliseconds
        const throughTime = existingResTime + (res.duration * millisecondsInHour);
        //Get the reservation request's date time in milliseconds
        const requestDateTime = (new Date(dateTime)).getTime();
        //Get the reservation request's end date time in milliseconds
        const requestThroughTime = requestDateTime + (duration * millisecondsInHour);
        //Check if the request's date time falls within any of the reservations start and end time
        const fallsWithIn = throughTime >= requestDateTime && existingResTime <= requestDateTime;
        //Check if the request's date time overlaps with any of the existing reservations for the tables
        const overLapses = requestDateTime <= existingResTime && requestThroughTime >= existingResTime;
        //Filter the table's reservations based on these conditions
        return fallsWithIn || overLapses;
    });
    //Check if the length of the filtered list is greater than 0.
    return reservations.length > 0;
};

const currency = {
    naira: "NGN",
    usDollar: "USD",
    pound: "GBP"
}
 
const maximumDate = new Date('9999-12-31');
const epochDate = new Date(0);
const minimumDate =  new Date('0001-01-01');

module.exports = {
    randomNumBetweenRange,
    emailConfirmationMessage,
    resetPasswordMessage,
    isNotANumber,
    toNumber,
    toMinutes,
    processPaymentStatus,
    validDateRange,
    anHourInSeconds,
    differenceInDate,
    confirmReservationMessage,
    capitalizeFirstWord,
    capitalizeFirstLetters,
    isReservationAConflict,
    maximumDate,
    minimumDate,
    epochDate,
    MAX_DURATION,
    MIN_DURATION,
    TWO,
    FIVE,
    FIFTY,
    range,
    range2,
    currency,
    MAX_FILE_SIZE,
    allowedFileExt,
};