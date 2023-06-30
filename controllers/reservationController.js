const User = require('../models/User');
const { tableStatuses } = require('../config/statuses');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { changeTableStatus } = require('../utils/cronJobs');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');
const { toNumber } = require('../helpers/helperFs');

const create = async (req, res) => {
    const userId = getLoggedInUserId(req);
    const {
        customerPhone,
        dateTime,
        duration,
        table,
        partySize
    } = req.body

    try 
    {
        const user = await User.findOne({ _id: userId }).exec();
        if(!user) return res.status(404).json({ message: `No user found with the Id: ${userId}` });
        const tableFromDb = await Table.findOne({ _id: table }).exec();
        if(!tableFromDb) return res.status(404).json({ message: `No table record found with Id: ${table}`});

        const newReservation = {
            customerName: user.displayName,
            customerEmail: user.email,
            customerPhone: customerPhone,
            dateTime: new Date(dateTime),
            duration: toNumber(duration),
            table: table,
            partySize: toNumber(partySize)
        };
        //=======Create Reservation===========//
        tableFromDb.status = tableStatuses.Reserved;
        tableFromDb.reservations = tableFromDb.reservations.push(table);
        //=========Save table model===========//

        //==Schedule another job to change the status back to available after the duration elapses==//

        //============Send reservation details to User=======//
        res.status(200).json({reserve: newReservation, table: tableFromDb });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
    //await changeTableStatus('rtrtrr', tableStatuses.Occupied, new Date());
    //res.status(200).json({message: new Date(dateTime)});
};

const updateTimeAndDuration = async(req, res) => {
    const id = req.id;
    const {
        dateTime,
        duration
    } = req.body

    if(!dateTime) return res.status(400).json({message: 'Reservation date and time is required.'});
    if(isNotANumber(duration)) return res.status(400).json({message: 'Invalid duration entered.'});
    if(toNumber(duration) <= 0) return res.status(400).json({message: 'Duration must be at least, 15 minutes.'});

    try 
    {
        const reservation = await Reservation.findOne({ _id: id }).exec();
        if(!reservation) return res.status(404).json({message: `No reservation record found with Id: ${id}`});
        const table = await Table.findOne({ _id: reservation.table }).exec();
        if(!table) return res.status(404).json({message: `No table found with Id: ${reservation.table}`});
        
        //schedule a job to set the table status to available at the previous time
        reservation.dateTime = dateTime;
        reservation.duration = duration;
        //Save the changes.

        //schedule a job to set the table status to occupied at the new time.

        //schedule a job to set the status to available after the duration
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const updateTableAndPartySize = async(req, res) => {
    const id = req.id
    const {
        table,
        partySize
    } = req.body

    if(isNotANumber(partySize)) return res.status(400).json({message: 'Invalid value for party size.'});
    if(toNumber(partySize) <= 0) return res.status(400).json({message: 'Party size must be greater than 0'});

    try 
    {
        const reservation = await Reservation.findOne({ _id: id }).exec();
        if(!reservation) return res.status(404).json({message: `No reservation record found with Id: ${id}`});
        const tableFromDb = await Table.findOne({ _id: table }).exec();
        if(!tableFromDb) return res.status(404).json({message: `No table found with Id: ${table}`});
        if(tableFromDb.status !== tableStatuses.Available) return res.status(400).json({message: `Table ${tableFromDb.number}, not available at the moment. Try again shortly`});
        if(tableFromDb.capacity < toNumber(partySize)) return res.status(400).json({message: `Your party size (${partySize}) is more than the table capacity (${tableFromDb.capacity})`});
        
        //schedule a job to set the table status to available at the previous time
        reservation.table = table;
        reservation.partySize = partySize;
        //Save the changes.

        //schedule a job to set the table status to occupied at the new time.

        //schedule a job to set the status to available after the duration
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const update = async (req, res) => {
    const id = req.id
    const userId = getLoggedInUserId(req);
    const {
        customerPhone,
        dateTime,
        duration,
        table,
        partySize
    } = req.body

    try 
    {
        const reservation = await Reservation.findOne({ _id: id }).exec();
        if(!reservation) return res.status(404).json({message: `No reservation record found with Id: ${id}`});
        const user = await User.findOne({ _id: userId }).exec();
        if(!user) return res.status(404).json({ message: `No user found with the Id: ${userId}` });
        const tableFromDb = await Table.findOne({ _id: table }).exec();
        if(!tableFromDb) return res.status(404).json({ message: `No table record found with Id: ${table}`});

        //=======Update Reservation===========//
        tableFromDb.status = tableStatuses.Reserved;
        tableFromDb.reservations = tableFromDb.reservations.push(table);
        //=========Save table model===========//

        //==Schedule another job to change the status back to available after the duration elapses==//

        //============Send reservation details to User=======//
        res.status(200).json({reserve: newReservation, table: tableFromDb });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    create,
    updateTableAndPartySize,
    updateTimeAndDuration
};