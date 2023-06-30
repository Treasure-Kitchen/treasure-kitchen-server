const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');

const create = async (req, res) => {
    const userId = getLoggedInUserId(req);

    res.status(200).json({message: userId});
};

const update = async (req, res) => {
    const id = req.id
    const userId = getLoggedInUserId(req);

    res.status(200).json({message: `ReservationId: ${id}. UserId: ${userId}`});
};

module.exports = {
    create,
    update
};