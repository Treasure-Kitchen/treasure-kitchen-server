const { isNotANumber } = require('../helpers/helperFs');
const Table = require('../models/Table');

const validateTableRequest = async (req, res, next) => {
    const {
        name,
        capacity
    } = req.body;

    if(!name) return res.status(400).json({message: `Table name is required.`});
    if(isNotANumber(capacity)) return res.status(400).json({ message: `${capacity} is not a valid number.` });

    try {
        const count = await Table.countDocuments(
            { name: name }
        ).exec();
        if(count) return res.status(400).json({message: `There is already a table named ${name}`});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    next();
};

module.exports = validateTableRequest;