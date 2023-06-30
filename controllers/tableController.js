const { tableStatuses } = require('../config/statuses');
const { toNumber } = require('../helpers/helperFs');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

const create = async (req, res) => {
    const {
        name,
        capacity
    } = req.body;

    try {
        const newTable = {
            "name": name,
            "capacity": toNumber(capacity)
        }

        await Table.create(newTable);
        res.status(200).json({message: 'Table successfully created'})
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        capacity
    } = req.body;

    try {
            const tableToUpdate = await Table.findOne({ _id: id });
            if(!tableToUpdate) return res.status(404).json({ message: `No table record found with Id: ${id}` });

            tableToUpdate.name = name;
            tableToUpdate.capacity = capacity;
            await tableToUpdate.save();

            res.status(200).json({ message: 'Table successfully updated' });
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const remove = async (req, res) => {
    const { id } = req.params;

    try {
            const count = await Reservation.countDocuments({ table: id }).where("dateTime").gt(new Date());
            if(count > 0) return res.status(400).json({message: 'You can not delete a table with future reservations.'});

            await Table.deleteOne({ _id: id });
            res.status(200).json({message:'Table successfully deleted.'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const getById = async (req, res) => {
    const { id } = req.params;

    try {
            const table = await Table.findOne({ _id: id });
            if(!table) return res.status(404).json({message: `No table record found for Id: ${id}`});
            res.status(200).json(table);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const getAll = async (req, res) => {
    try {
            const tables = await Table.find()
                                .sort({ name: 1 })
                                .select('name capacity status');
            res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const getAvailable = async (req, res) => {
    try {
            const tables = await Table.find({ status: tableStatuses.Available })
                                .sort({ name: 1 })
                                .select('name capacity status');
            res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

module.exports = {
    create,
    update,
    remove,
    getById,
    getAll,
    getAvailable
}