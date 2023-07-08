const Employee = require('../models/Employee');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');

const canPerform = async (req, res, next) => {
    const loggedInemployeeId = getLoggedInUserId(req);
    const { id } = req.params;
    try {
            const performer = await Employee.findOne({ _id: loggedInemployeeId }).populate('role').exec();
            const performee = await Employee.findOne({ _id: id }).populate('role').exec();
            if(!performer) return res.status(404).json({message: `Logged in employee not found`});
            if(!performee) return res.status(404).json({message: 'Target employee not found'});
            if(performer.role.role <= performee.role.role) return res.status(403).json({message: `You don't have enough permission to perform this operation.`});

            next()
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

module.exports = canPerform;