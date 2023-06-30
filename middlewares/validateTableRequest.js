const { isNotANumber } = require('../helpers/helperFs');
const Table = require('../models/Table');

const validateTableRequest = async (req, res, next) => {
    const {
        number,
        capacity
    } = req.body;
    if(isNotANumber(number)) return res.status(400).json({message: `Table Number is required. Please enter a valid number.`});
    if(isNotANumber(capacity)) return res.status(400).json({ message: `${capacity} is not a valid number.` });

    try {
            if(req.method !== 'PATCH'){
                const count = await Table.countDocuments(
                    { number: number }
                ).exec();
                if(count > 0) return res.status(400).json({message: `There is already a table number ${number}`});
            }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    next();
};

module.exports = validateTableRequest;