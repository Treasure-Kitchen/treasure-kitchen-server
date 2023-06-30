const { toNumber, isNotANumber } = require("../helpers/helperFs");
const validatePhoneNumber = require('validate-phone-number-node-js');
const Table = require("../models/Table");
const { tableStatuses } = require("../config/statuses");

const validateReservationRequest = (req, res, next) => {
    const {
            customerPhone,
            dateTime,
            table,
            partySize
    } = req.body;

    if(!dateTime) return res.status(400).json({message: 'Reservation date and time is required.'});
    if(customerPhone && !validatePhoneNumber.validate(customerPhone)) return res.status(400).json({ 'message': 'Invalid phone number.' });
    if((new Date()).getTime() > (new Date(dateTime).getTime())) return res.status(400).json({ 'message':'Date cannot be in the past' });
    if(isNotANumber(partySize)) return res.status(400).json({message: 'Invalid value for party size.'});
    if(toNumber(partySize) <= 0) return res.status(400).json({message: 'Party size must be greater than 0'});

    Table.findOne({ _id: table, status: tableStatuses.Available })
                .then((tableFromDb) => {
                    if(!tableFromDb) return res.status(404).json({message: `The table, ${tableFromDb.name}, not available at the moment. Try again shortly`});
                })
                .catch((error) => {
                    res.status(500).json({message: error.message});
            });
    next();
};

module.exports = validateReservationRequest;