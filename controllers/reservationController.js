const User = require('../models/User');
const { tableStatuses, reservationStatuses } = require('../config/statuses');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { changeTableReservationStatus, cancelReservationIfNotConfirmed } = require('../utils/cronJobs');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');
const { toNumber, toMinutes, TWO, MIN_DURATION, MAX_DURATION, isReservationAConflict, capitalizeFirstWord, minimumDate, maximumDate, validDateRange, isNotANumber } = require('../helpers/helperFs');
const { addMinutes, differenceInMilliseconds, parseISO, addMilliseconds } = require('date-fns');
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
        console.log(cancelAtDate)
        cancelReservationIfNotConfirmed(reservation._id, cancelAtDate);
        //=========Send Notification=============//
        const payload = {
            name: user.displayName, 
            email: user.email, 
            subject: "Confirm Your Reservation", 
            cancelAtDate: cancelAtDate
        };
        await sendReservationNotification(payload);

        res.status(200).json({message: `Reservation successfully added. Please proceed to confirm before ${cancelAtDate}.`});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTimeAndDuration = async(req, res) => {
    const { id } = req.params;
    const {
        dateTime,
        duration
    } = req.body

    if(!dateTime) return res.status(400).json({message: 'Reservation date and time is required.'});
    if(isNotANumber(duration)) return res.status(400).json({message: 'Invalid duration entered.'});
    if(toNumber(duration) < MIN_DURATION || toNumber(duration > MAX_DURATION)) return res.status(400).json({message: 'Duration must be between 30 minutes and 13 hours.'});

    try 
    {
        const reservation = await Reservation.findOne({ _id: id }).exec();
        if(!reservation) return res.status(404).json({message: `No reservation record found with Id: ${id}`});
        if(reservation.status === reservationStatuses.Confirmed) return res.status(400).json({message: 'You can not update an already confirmed reservation.'});
        const table = await Table.findOne({ _id: reservation.table }).exec();
        if(!table) return res.status(404).json({message: `No table found with Id: ${reservation.table}`});
        if(isReservationAConflict(table, dateTime, toNumber(duration))) return res.status(409).json({message: 'There is already a reservation for this table at the time, please try another date.'});
        //schedule a job to set the table status to available at the previous time
        reservation.dateTime = dateTime;
        reservation.duration = duration;
        //Save the changes.
        await reservation.save();
        //======Schedule a job to change status to occupied at the said date
        //if reservation is confirmed=====================================//
        changeTableReservationStatus(table._id, reservation._id, tableStatuses.Occupied, parseISO(dateTime));
        //==Schedule another job to change the status back to available after the duration elapses==//
        const changeAtDate = addMinutes(parseISO(dateTime), toMinutes(toNumber(duration)));
        changeTableReservationStatus(table._id, reservation._id, tableStatuses.Available, changeAtDate);
        //============Cancel reservation if not confirmed within a computed time=======//
        //===========Difference in date in milliseconds divided by 2, then converted to minutes
        const cancelAtDate = addMilliseconds(parseISO(dateTime), (differenceInMilliseconds( new Date(), parseISO(dateTime)) / TWO));
        cancelReservationIfNotConfirmed(reservation._id, cancelAtDate);
        //=========Send Notification=============//
        const user = await User.findOne({ email: reservation.customerEmail });
        if(user){
            const payload = {
                name: capitalizeFirstWord(user.displayName), 
                email: user.email, 
                subject: "Confirm Your Rescheduled Reservation", 
                cancelAtDate: cancelAtDate
            };
            await sendReservationNotification(payload);
        }
        res.status(200).json({message: `Reservation successfully added. Please proceed to confirm before ${cancelAtDate}.`});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const updateTableAndPartySize = async(req, res) => {
    const { id } = req.params;
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
        if(tableFromDb.capacity < toNumber(partySize)) return res.status(400).json({message: `Your party size (${partySize}) is more than the table capacity (${tableFromDb.capacity})`});
        if(isReservationAConflict(tableFromDb, reservation.dateTime, toNumber(reservation.duration))) return res.status(409).json({message: 'There is already a reservation for this table at the time, please try another date.'})
        
        //Remove previous table
        const prevTable = await Table.findOne({ _id: reservation.table }).exec();
        if(prevTable){
            prevTable.reservations = prevTable.reservations.filter((reserve) => {
                return reserve.toString() !== id;
            });
            //Save
            await prevTable.save();
        }
        //Update reservation
        reservation.table = table;
        reservation.partySize = partySize;
        //Update current table
        tableFromDb.reservations.push(reservation._id);
        //Save changes
        await reservation.save();
        await tableFromDb.save();
        //======Schedule a job to change status to occupied at the said date
        //if reservation is confirmed=====================================//
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Occupied, reservation.dateTime);
        //==Schedule another job to change the status back to available after the duration elapses==//
        const changeAtDate = addMinutes(new Date(reservation.dateTime), toMinutes(toNumber(reservation.duration)));
        changeTableReservationStatus(tableFromDb._id, reservation._id, tableStatuses.Available, changeAtDate);
        //============Cancel reservation if not confirmed within a computed time=======//
        //===========Difference in date in milliseconds divided by 2, then converted to minutes
        const cancelAtDate = addMilliseconds(new Date(reservation.dateTime), (differenceInMilliseconds( new Date(), new Date(reservation.dateTime)) / TWO));
        cancelReservationIfNotConfirmed(reservation._id, cancelAtDate);
        //Return response
        res.status(200).json({message: 'Reservation details successfully updated'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getAll = async (req, res) => {
    const { page, perPage, status, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, parseInt(page)) || 1;
    const pageSize = parseInt(perPage) || 10;
    const reservationStatus = status ? [status] : [reservationStatuses.Pending, reservationStatuses.Confirmed, reservationStatuses.Cancelled];
    const mnDate = minDate ? minDate : minimumDate;
    const mxDate = maxDate ? maxDate : maximumDate;
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const result = await Reservation.find()
                .where('status').in(reservationStatus)
                .where('dateTime').gte(mnDate).lte(mxDate)
                .sort({ dateTime: -1 })
                .select('customerName customerEmail customerPhone dateTime duration partySize status table')
                .populate('table', '_id number capacity')
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Reservation.countDocuments()
                    .where('status').in(reservationStatus)
                    .where('dateTime').gte(mnDate).lte(mxDate).exec();

            res.status(200).json({
                Data: result,
                MetaData: {
                    CurrentPage: currentPage,
                    PageSize: pageSize,
                    TotalPages: Math.ceil(count / pageSize),
                    ItemCount: count
                }
            });
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
};

const getByUserEmail = async(req, res) => {
    const userId = getLoggedInUserId(req);
    const { page, perPage, status, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, parseInt(page)) || 1;
    const pageSize = parseInt(perPage) || 10;
    const reservationStatus = status ? [status] : [reservationStatuses.Pending, reservationStatuses.Confirmed, reservationStatuses.Cancelled];
    const mnDate = minDate ? minDate : minimumDate;
    const mxDate = maxDate ? maxDate : maximumDate;
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const user = await User.findOne({ _id: userId });
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
            const result = await Reservation.find({ customerEmail: user.email })
                .where('status').in(reservationStatus)
                .where('dateTime').gte(mnDate).lte(mxDate)
                .sort({ dateTime: -1 })
                .select('_id dateTime duration partySize status table')
                .populate('table', '_id number capacity')
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Reservation.countDocuments({ customerEmail: user.email })
                    .where('status').in(reservationStatus)
                    .where('dateTime').gte(mnDate).lte(mxDate).exec();

            res.status(200).json({
                Data: result,
                MetaData: {
                    CurrentPage: currentPage,
                    PageSize: pageSize,
                    TotalPages: Math.ceil(count / pageSize),
                    ItemCount: count
                }
            });
        } catch(error){
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
            if(reservation.status === reservationStatuses.Cancelled) return res.status(400).json({message: 'Cancelled reservations can no longer be confirmed.'});
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

module.exports = {
    create,
    getAll,
    getByUserEmail,
    confirmReservation,
    cancelReservation,
    updateTableAndPartySize,
    updateTimeAndDuration
};