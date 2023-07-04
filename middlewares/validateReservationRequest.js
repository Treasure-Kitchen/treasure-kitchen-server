const { toNumber, isNotANumber, isReservationAConflict, MIN_DURATION, MAX_DURATION } = require("../helpers/helperFs");
const validatePhoneNumber = require('validate-phone-number-node-js');
const Table = require("../models/Table");

const validateReservationRequest = async (req, res, next) => {
    const {
            customerPhone,
            dateTime,
            duration,
            table,
            partySize
    } = req.body;
    if(!dateTime) return res.status(400).json({message: 'Reservation date and time is required.'});
    if(isNotANumber(duration)) return res.status(400).json({message: 'Invalid duration entered.'});
    if(customerPhone && !validatePhoneNumber.validate(customerPhone)) return res.status(400).json({ 'message': 'Invalid phone number.' });
    if((new Date()).getTime() > (new Date(dateTime)).getTime()) return res.status(400).json({ 'message':'Date cannot be in the past' });
    if(isNotANumber(partySize)) return res.status(400).json({message: 'Invalid value for party size.'});
    if(toNumber(partySize) <= 0) return res.status(400).json({message: 'Party size must be greater than 0'});
    if(toNumber(duration) < MIN_DURATION || toNumber(duration) > MAX_DURATION) return res.status(400).json({message: `Duration must be between 30 minutes and 13 hours.`});

    try {
        const tableFromDb = await Table.findOne({ _id: table}).populate('reservations').exec();
        if(tableFromDb){
            if(tableFromDb.capacity < toNumber(partySize)) return res.status(400).json({message: `Your party size (${partySize}) is more than the table capacity (${tableFromDb.capacity})`});
            //Check to be sure the table is not reserved within this particular time
            if(isReservationAConflict(tableFromDb, dateTime, toNumber(duration))) return res.status(409).json({message: 'There is already a reservation for this table at the time, please try another date.'});
        } else {
            return res.status(404).json({message: `No table found with Id: ${table}`});
        }

    } catch (error) {
        res.status(500).json({message: error.message});
    }
    next();
};

module.exports = validateReservationRequest;