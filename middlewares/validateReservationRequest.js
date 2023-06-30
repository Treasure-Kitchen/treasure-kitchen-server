const { toNumber, isNotANumber } = require("../helpers/helperFs");
const validatePhoneNumber = require('validate-phone-number-node-js');
const Table = require("../models/Table");
const { tableStatuses } = require("../config/statuses");

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
    if(toNumber(duration) <= 0) return res.status(400).json({message: 'Duration must be at least, 15 minutes.'})
    if(customerPhone && !validatePhoneNumber.validate(customerPhone)) return res.status(400).json({ 'message': 'Invalid phone number.' });
    if((new Date()).getTime() > (new Date(dateTime).getTime())) return res.status(400).json({ 'message':'Date cannot be in the past' });
    if(isNotANumber(partySize)) return res.status(400).json({message: 'Invalid value for party size.'});
    if(toNumber(partySize) <= 0) return res.status(400).json({message: 'Party size must be greater than 0'});

    try {
        const tableFromDb = await Table.findOne({ _id: table}).exec();
        if(tableFromDb){
            if(tableFromDb.status !== tableStatuses.Available) return res.status(400).json({message: `Table ${tableFromDb.number}, not available at the moment. Try again shortly`});
            if(tableFromDb.capacity < toNumber(partySize)) return res.status(400).json({message: `Your party size (${partySize}) is more than the table capacity (${tableFromDb.capacity})`});
        } else {
            return res.status(404).json({message: `No table found with Id: ${table}`});
        }

    } catch (error) {
        res.status(500).json({message: error.message});
    }
    next();
};

module.exports = validateReservationRequest;