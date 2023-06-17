const Order = require('../models/Order');
const Dish = require('../models/Dish');

const create = async (req, res) => {
    const {
        customerName,
        tableName,
        dishes
    } = req.body;

    if(!customerName) return res.status(400).json({message: 'Customer Name is a required field.'});
    if(!tableName) return res.status(400).json({message: 'Table Name is a required field.'});
    if(!dishes.length <= 0) return res.status(400).json({message: `Your Order must include at least, one dishe.`});

    try {
    const dishesFromDb = await Dish.find({
        _id: { $in: dishes }
    })

    let totalPrice = 0
    dishesFromDb.forEach((dish) => {
        totalPrice += dish.price;
    })

    const newOrder = {
        "customerName": customerName,
        "tableName": tableName,
        "price": totalPrice,
        "dishes": dishes
    }

    const result = await Order.create(newOrder);
    if(dishes.length > 0){
        await Dish.updateMany(
            { _id: { $in: dishes }},
            { $push: { orders: result._id }}
        );
    }
    res.status(200).json({message: 'Order placed successfully'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create
};