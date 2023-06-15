const { deleteOne } = require('../models/Employee');
const Position = require('../models/Position');

const create = async (req, res) => {
    const {
        name
    } = req.body;

    if(!name) return res.status(400).json({ 'message': 'Postion Name is required '});
    try {
        await Position.create({
            "name": name
        });

        res.status(200).json({ 'message': 'Position successfully added.' });
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const update = async (req, res) => {
    const { name } = req.body;
    if(!name) return res.status(400).json({ 'message': 'Position Name is required' });
    try {
        const position = await Position.findOne({ _id: req.params.id });
        if(!position){
            res.status(404).json({ 'message': `No position with Id: ${req.params.id}` });
        } else {
            position.name = name;
            await position.save();
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const remove = async (req, res) => {
    try {
        const position = await Position.findOne({ _id: req.params.id });
        if(!position){
            res.status(404).json({ 'message': `No position with Id: ${req.params.id}` });
        } else {
            await deleteOne({ _id: req.params.id });
            res.status(200).json({ 'message': 'Position successfully deleted.' });
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const positions = await Position.find();
        res.status(200).json(positions);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getById = async (req, res) => {
    const id = req.params.id;
    try {
        const position = await Position.findOne({ _id: id });
        if(position){
            res.status(200).json(position);
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

module.exports = {
    create,
    update,
    remove,
    getAll,
    getById
}