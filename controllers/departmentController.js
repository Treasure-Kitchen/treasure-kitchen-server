const Department = require('../models/Department');

const create = async (req, res) => {
    const {
        name
    } = req.body;

    if(!name) return res.status(400).json({ 'message': 'Department Name id required '});
    try {
        await Department.create({
            "name": name
        });

        res.status(200).json({ 'message': 'Department successfully added.' });
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const update = async (req, res) => {
    const { name } = req.body;
    if(!name) return res.status(400).json({ 'message': 'Department Name is required' });
    try {
        const department = await Department.findOne({ _id: req.params.id });
        if(!department){
            res.status(404).json({ 'message': `No Department with Id: ${req.params.id}` });
        } else {
            department.name = name;
            await Department.save();
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const remove = async (req, res) => {
    try {
        const department = await Department.findOne({ _id: req.params.id });
        if(!department){
            res.status(404).json({ 'message': `No Department with Id: ${req.params.id}` });
        } else {
            await Department.deleteOne({ _id: req.params.id });
            res.status(200).json({ 'message': 'Department successfully deleted.' });
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getById = async (req, res) => {
    const id = req.params.id;
    try {
        const department = await Department.findOne({ _id: id });
        if(department){
            res.status(200).json(department);
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