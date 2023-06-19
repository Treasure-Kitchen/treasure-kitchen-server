const Dish = require('../models/Dish');

const validateOrderRequest = async (req, res, next) => {
    const {
        tableName,
        phoneNumber,
        dishes
    } = req.body;

    if(!tableName) return res.status(400).json({message: 'Table Name is a required field.'});
    if(!dishes.length <= 0) return res.status(400).json({message: `Your Order must include at least, one dish.`});

    try {
        const count = await Dish.countDocuments(
            { _id: { $in: dishes } }
        ).exec();
        if(count !== dishes.length) return res.status(404).json({message: 'One or more dishes could not be found'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    next();
};

module.exports = validateOrderRequest;