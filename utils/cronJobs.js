const cron = require('node-schedule');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { reservationStatuses, tableStatuses } = require('../config/statuses');
const { addMinutes, parseISO } = require('date-fns');
const { toMinutes } = require('../helpers/helperFs');

const changeTableStatus = (id, status, dateTime) => {
    const date = new Date(dateTime);
    cron.scheduleJob(date, async () => {
        try {
            const table = await Table.findOne({ _id: id }).exec();
            if(table && table.status !== status){
                table.status = status;
                await table.save();
            }
        } catch (error) {
            throw error;
        }
    });
};

const changeReservationStatus = (id, status, dateTime) => {
    const date = new Date(dateTime);
    cron.scheduleJob(date, async () => {
        try {
            const reservation = await Reservation.findOne({ _id: id }).exec();
            if(reservation){
                const newDateTime = new Date(addMinutes(new Date(reservation.dateTime), toMinutes(reservation.duration)));
                if(newDateTime === date){
                    reservation.status = status;
                    await reservation.save();
                }
            }
        } catch (error) {
            throw error;
        }
    });
};

const changeTableReservationStatus = (tableId, reservationId, tableStatus, dateTime) => {
    cron.scheduleJob(dateTime, async () => {
        try {
            const reservation = await Reservation.findOne({ _id: reservationId }).exec();
            const table = await Table.findOne({ _id: tableId, reservations: reservationId }).exec();
            //Check if the reservation date and duration has changed
            //in which case the job would not run, because another job
            //would have been scheduled for the new changes
            if(reservation && table){
                if(reservation.status === reservationStatuses.Confirmed 
                    && ((new Date(reservation.dateTime)).getTime() == dateTime.getTime())
                ){
                    table.status = tableStatus;
                    await table.save();
                }
            }
        } catch (error) {
            throw error;
        }
    });
};

const cancelReservationIfNotConfirmed = (id, dateTime) => {
    cron.scheduleJob(dateTime, async () => {
        try {
            const reservation = await Reservation.findOne({ _id: id }).exec();
            if(reservation){
                if(reservation.status !== reservationStatuses.Confirmed){
                    reservation.status = reservationStatuses.Cancelled;
                    await reservation.save();
                }
            }
        } catch (error) {
            throw error;
        }
    });
};

module.exports = {
    changeTableStatus,
    changeReservationStatus,
    changeTableReservationStatus,
    cancelReservationIfNotConfirmed
}