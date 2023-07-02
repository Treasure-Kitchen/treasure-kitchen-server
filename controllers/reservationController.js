const User = require('../models/User');
const { tableStatuses, reservationStatuses } = require('../config/statuses');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { changeTableReservationStatus, cancelReservationIfNotConfirmed } = require('../utils/cronJobs');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');
const { toNumber, toMinutes, differenceInDate, TWO } = require('../helpers/helperFs');
const { addMinutes, millisecondsInMinute, differenceInMilliseconds, parseISO, addMilliseconds } = require('date-fns');
const { sendReservationNotification } = require('../helpers/emailSlave');

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
        //Initialize Reservation
        const reservation = new Reservation({
            customerName: user.displayName,
            customerEmail: user.email,
            customerPhone: customerPhone,
            dateTime: parseISO(dateTime),
            duration: toNumber(duration),
            table: table,
            partySize: toNumber(partySize)
        });
        //===========Update Table and save=============//
        //tableFromDb.status = tableStatuses.Reserved;
        tableFromDb.reservations.push(reservation._id);
        //Save
        await tableFromDb.save();
        await reservation.save();
        //======Schedule a job to change status to occupied at the said date
        //if reservation is confirmed=====================================//
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Occupied, parseISO(dateTime));
        //==Schedule another job to change the status back to available after the duration elapses==//
        const changeAtDate = addMinutes(parseISO(dateTime), toMinutes(toNumber(duration)));
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Available, changeAtDate);
        //============Cancel reservation if not confirmed within a computed time=======//
        //===========Difference in date in milliseconds divided by 2, then converted to minutes
        const cancelAtDate = addMilliseconds(parseISO(dateTime), (differenceInMilliseconds( new Date(), parseISO(dateTime)) / TWO));
        cancelReservationIfNotConfirmed(reservation._id, cancelAtDate);
        //=========Send Notification=============//
        const payload = {
            name: user.displayName, 
            email: user.email, 
            subject: "Confirm Your Reservation", 
            cancelAtDate: cancelAtDate
        };
        await sendReservationNotification(payload);
        res.status(200).json({message: 'Reservation successfully added. Please proceed to confirm.'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
        await reservation.save();
        //======Schedule a job to change status to occupied at the said date
        //if reservation is confirmed=====================================//
        changeTableReservationStatus(table._id, reservation._id, tableStatuses.Occupied, new Date(reservation.dateTime));
        //==Schedule another job to change the status back to available after the duration elapses==//
        const changeAtDate = addMinutes(new Date(reservation.dateTime), toMinutes(reservation.duration));
        changeTableReservationStatus(table._id, reservation._id, tableStatuses.Available, changeAtDate);
        //Return response
        res.status(200).json({message: `Reservation date and time successfully updated`});
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
        if(reservation.status === reservationStatuses.Confirmed) return res.status(400).json({message: `You can not edit a confirmed reservation.`});
        const tableFromDb = await Table.findOne({ _id: table }).exec();
        if(!tableFromDb) return res.status(404).json({message: `No table found with Id: ${table}`});
        if(tableFromDb.status !== tableStatuses.Available) return res.status(400).json({message: `Table ${tableFromDb.number}, not available at the moment. Try again shortly`});
        if(tableFromDb.capacity < toNumber(partySize)) return res.status(400).json({message: `Your party size (${partySize}) is more than the table capacity (${tableFromDb.capacity})`});
        
        //Remove previous table
        const prevTable = await Table.findOne({ _id: reservation.table }).exec();
        if(prevTable){
            prevTable.reservations = prevTable.reservations.filter((reserve) => {
                return reserve === reservation.table
            });
            //Save
            await prevTable.save();
        }
        //Update reservation
        reservation.table = table;
        reservation.partySize = partySize;
        //Update current table
        tableFromDb.reservations = tableFromDb.reservations.push(reservation._id);
        //Save changes
        await reservation.save();
        await tableFromDb.save();
        //======Schedule a job to change status to occupied at the said date
        //if reservation is confirmed=====================================//
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Occupied, new Date(reservation.dateTime));
        //==Schedule another job to change the status back to available after the duration elapses==//
        const changeAtDate = addMinutes(new Date(reservation.dateTime), toMinutes(reservation.duration));
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Available, changeAtDate);
        //Return response
        res.status(200).json({message: 'Reservation details successfully updated'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getAll = async (req, res) => {
    try {
        const reservations = await Reservation
                                    .find()
                                    .sort({ dateTime: -1 })
                                    .populate('table', '_id number capacity');
        res.status(200).json(reservations);
    } catch(error){
        res.status(500).json({message: error.message});
    }
};

const cancelReservation = async(req, res) => {
    const { id } = req.params;
    try {
            const reservation = await Reservation.findOne({ _id: id });
            if(!reservation) return res.status(404).json({message: `No reservation record found for Id: ${id}`});
            if(reservation.status === reservationStatuses.Confirmed) return res.status(400).json({message: 'You can not cancel an already confirmed reservation.'});
            //Update
            reservation.status = reservationStatuses.Cancelled;
            //Save
            await reservation.save();
            res.status(200).json({message: 'Reservation successfully cancelled.'});
    } catch (error) {
        res.status(500).json({message: error.message });
    }
}

const getByUserEmail = async(req, res) => {
    const userId = getLoggedInUserId(req);
    try {
            const user = await User.findOne({ _id: userId });
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
            const reservations = await Reservation
                                        .find({ customerEmail: user.email })
                                        .sort({ dateTime: -1 })
                                        .select('_id dateTime duration partySize status table')
                                        .populate({
                                            path: 'table',
                                            select: '_id number capacity'
                                        });
            res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const confirmReservation = async(req, res) => {
    const { id } = req.params;
    const {
        cardNumber,
        cardPin,
        cvv
    } = req.body;

    try {
            const reservation = await Reservation.findOne({ _id: id });
            if(!reservation) return res.status(404).json({message: `No reservation found with Id: ${id}`});
            if(reservation.status === reservationStatuses.Cancelled) return res.status(400).json({message: 'Cancelled reservations can not be confirmed.'});
            if(reservation.status === reservationStatuses.Confirmed) return res.status(400).json({message: 'Reservation already confirmed.'});
            //Verify payment credentials and make necessary deducations
            //Update reservation
            reservation.status = reservationStatuses.Confirmed;
            //Save
            await reservation.save();
            res.status(200).json({message: 'Reservation confirmed. Please check your mail for details.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const tempTest = async(req, res) => {
    const {
        dateTime,
        duration,
        table,
        reservation
    } = req.body;
    changeTableReservationStatus(table, reservation, tableStatuses.Occupied, new Date(reservation.dateTime));
    //==Schedule another job to change the status back to available after the duration elapses==//
    const changeAtDate = addMinutes(new Date(dateTime), toMinutes(duration));
    changeTableReservationStatus(table, reservation, tableStatuses.Available, changeAtDate);
    //Return response
    res.status(200).json({message: 'Success'});
}

module.exports = {
    tempTest,
    create,
    getAll,
    getByUserEmail,
    confirmReservation,
    cancelReservation,
    updateTableAndPartySize,
    updateTimeAndDuration
};