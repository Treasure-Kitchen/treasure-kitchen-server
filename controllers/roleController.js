const Role = require('../models/Role');

const create = async (req, res) => {
    const { name, role } = req.body;
    if(!name || !role) return res.status(400).json({ 'message': 'Please fill in the required fields' });

    try {
        const duplicate = await Role.findOne({ name: name } || { role: role}).exec();
        if(!duplicate){
            await Role.create({
                "name": name,
                "role": role
            });
            res.status(200).json({ 'message': 'Role successfully created.' });
        } else {
            return res.status(409).json({ 'message': `There's already a role record with name: ${name} and role: ${role}` });
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const getById = async (req, res) => {
    const id = req.params.id;

    try {
        const role = await Role.findOne({ _id: id }).exec();
        if(!role){
            res.status(404).json({ 'message': `No role with the Id: ${id}`});
        } else {
            res.status(200).json(role);
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const update = async (req, res) => {
    const id = req.params.id;
    const { name, role } = req.body;

    if(!name || !role) return res.status(400).json({ 'message': 'Please fill in the required fields' });
    try {
        const roleToUpdate = await Role.findOne({ _id: id });
        if(roleToUpdate){
            roleToUpdate.name = name;
            roleToUpdate.role = role;
            //Save changes
            roleToUpdate.save();
        } else {
            res.status(404).json({ 'message': `No role found with the Id: ${id}` });
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const remove = async (req, res) => {
    const id = req.params.id;
    try {
        const role = await Role.findOne({ _id: id });
        if(role){
            await Role.deleteOne({ _id: id });
        } else {
            res.status(404).json({ 'message': `No role found with the Id: ${id}` });
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
}