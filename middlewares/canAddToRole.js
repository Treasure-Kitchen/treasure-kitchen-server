const Employee = require('../models/Employee');
const Role = require('../models/Role');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');

const canAddToRole = async (req, res, next) => {
    const loggedInemployeeId = getLoggedInUserId(req);
    const { roleId } = req.params;
    try {
            const employee = await Employee.findOne({ _id: loggedInemployeeId }).populate('role').exec();
            if(!employee) return res.status(404).json({message: `Logged in employee not found`});
            const role = await Role.findOne({ _id: roleId }).exec();
            if(!role) return res.status(404).json({message: 'Role not found.'});
            if(employee.role.role > role.role) return res.status(403).json({message: `You don't have enough permission to add a user to ${role.name} role.`});

            next()
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

module.exports = canAddToRole;