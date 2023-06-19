const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { orderStatuses, paymentStatuses } = require('../config/statuses');
const { isNotANumber, toNumber, processPaymentStatus, validDateRange, minimumDate, maximumDate } = require('../helpers/helperFs');
const User = require('../models/User');

const create = async (req, res) => {
    const { userId } = req.params;
    const {
        tableName,
        dishes
    } = req.body;

    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with Id: ${userId}`});

            const dishesFromDb = await Dish.find({
                _id: { $in: dishes }
            }).exec();

            let totalPrice = 0;
            dishesFromDb.forEach((dish) => {
                totalPrice += dish.price;
            })

            const newOrder = {
                "customerName": `${user.firstName} ${user?.lastName}`,
                "email": user?.email,
                "phoneNumber": user?.phoneNumber,
                "tableName": tableName,
                "price": totalPrice,
                "balance": totalPrice,
                "dishes": dishes
            };

            await Order.create(newOrder);
            //TODO: send email to user
            res.status(200).json({message: 'Order placed successfully. Please check your email to confirm your order.'});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
};

const update = async (req, res) => {
    const { id } = req.params;
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.status(403).json({message: 'You are forbidden from accessing this resource.'});
    const refreshToken = cookies.jwt;
    const {
        tableName,
        dishes
    } = req.body;
    if(!tableName) return res.status(400).json({message: 'Table Name is a required field.'});
    if(!dishes.length <= 0) return res.status(400).json({message: `Your Order must include at least, one dish.`});

    try {
            const user = await User.findOne({ refreshToken: refreshToken }).exec();
            if(!user) return res.status(404).json({message: `No user found.`});

            const dishesFromDb = await Dish.find({
                _id: { $in: dishes }
            }).exec();
            if(dishesFromDb.length !== dishes.length) return res.status(404).json({message: 'One or more dishes could not be found'});

            let totalPrice = 0;
            dishesFromDb.forEach((dish) => {
                totalPrice += dish.price;
            });

            const order = await Order.findOne({ _id: id }).exec();
            if(!order) return res.status(404).json({message: `Could not find an order with Id: ${id}`});

            order.customerName = `${user?.firstName} ${user?.lastName}`;
            order.tableName = tableName;
            order.dishes = dishes;
            order.price = price;
            order.balance = (price - order.amountPaid);
            //Save
            await order.save();
            res.status(200).json({message: 'Order details successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const confirm = async (req, res) => {
    const { id } = req.params;
    const { otp } = req.body;

    try {
        const order = await Order.findOne({ _id: id }).exec();
        if(!order) return res.status(404).json({message: `Could not find order with Id: ${id}`});
        if(order.otp !== otp) return res.status(400).json({message: `You entered the wrong One-Time-Password`});

        order.status = orderStatuses.InProgress;
        order.set('otp', undefined, {strict: false} );
        order.save();

        res.status(200).json({message: "Order successfully confirmed. Please proceed to payment section."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const pay = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if(isNotANumber(amount)) return res.status(400).json({message: `Invalid payment amount: ${amount}.`});
    if(toNumber(amount) <= 0) return res.status(400).json({message: `Amount must be greater than 0.`});

    try {
        const order = await Order.findOne({ _id: id }).exec();
        if(!order) return res.status(404).json({message: `Could not find an order with Id: ${id}`});
        //Update
        order.amountPaid = toNumber(amount);
        order.balance = (order.price - toNumber(amount));
        order.status = (order.price - toNumber(amount)) === 0 || (order.price - toNumber(amount) < 0) ? 
                orderStatuses.Completed : 
                orderStatuses.InProgress;
        order.paymentStatus = processPaymentStatus(order, toNumber(amount));
        //Save
        order.save();
        //TODO: Send order details to the user email
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAll = async (req, res) => {
    const { page, perPage, status, payStatus, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
    const orderStatus = status ? [status] : [orderStatuses.Pending, orderStatuses.InProgress, orderStatuses.Completed];
    const paymentStatus = payStatus ? [payStatus] : [paymentStatuses.Yes, paymentStatuses.No, paymentStatuses.Partial, paymentStatuses.OverPaid];
    const mnDate = minDate ? new Date(minDate) : new Date(minimumDate);
    const mxDate = maxDate ? new Date(maxDate) : new Date(maximumDate);
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const result = await Order.find()
                .where('status').in(orderStatus)
                .where('paymentStatus').in(paymentStatus)
                .where('dateTime').gte(mnDate).lte(mxDate)
                .sort({ dateTime: -1 })
                .select('_id customerName email phoneNumber tableName status price amountPaid balance dateTime paymentStatus dishes')
                .populate({
                    path: 'dishes',
                    select: '_id name'
                })
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Order.countDocuments()
                    .where('status').in(orderStatus)
                    .where('paymentStatus').in(paymentStatus)
                    .where('dateTime').gte(mnDate).lte(mxDate).exec();

            res.status(200).json({
                Data: result,
                MetaData: {
                    CurrentPage: currentPage,
                    PageSize: pageSize,
                    TotalPages: Math.ceil(count / pageSize),
                    ItemCount: count
                }
            });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getByUserId = async (req, res) => {
    const { userId } = req.params;
    const {page, perPage, status, payStatus, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
    const orderStatus = status ? [status] : [orderStatuses.Pending, orderStatuses.InProgress, orderStatuses.Completed];
    const paymentStatus = payStatus ? [payStatus] : [paymentStatuses.Yes, paymentStatuses.No, paymentStatuses.Partial, paymentStatuses.OverPaid];
    const mnDate = minDate ? new Date(minDate) : new Date(minimumDate);
    const mxDate = maxDate ? new Date(maxDate) : new Date(maximumDate);
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});

            const result = await Order.find({ email: user?.email })
                .where('status').in(orderStatus)
                .where('paymentStatus').in(paymentStatus)
                .where('dateTime').gte(mnDate).lte(mxDate)
                .sort({ dateTime: -1 })
                .select('_id customerName email phoneNumber tableName status price amountPaid balance dateTime paymentStatus dishes')
                .populate({
                    path: 'dishes',
                    select: '_id name'
                })
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Order.countDocuments()
                    .where('status').in(orderStatus)
                    .where('paymentStatus').in(paymentStatus)
                    .where('dateTime').gte(mnDate).lte(mxDate).exec();

            res.status(200).json({
                Data: result,
                MetaData: {
                    CurrentPage: currentPage,
                    PageSize: pageSize,
                    TotalPages: Math.ceil(count / pageSize),
                    ItemCount: count
                }
            });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
            const order = await Order.findOne({ _id: id })
                    .select('_id customerName email phoneNumber tableName status price amountPaid balance dateTime paymentStatus dishes')
                    .populate({
                        path: 'dishes',
                        select: '_id name'
                    }).exec();
            if(!order) return res.status(404).json({message: `No order found with the Id: ${id}`});
            res.status(200).json(order);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const remove = async (req, res) => {
    const { id } = req.params;
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.status(403).json({message: 'You are forbidden from accessing this resource.'});
    const refreshToken = cookies.jwt;

    try {
        const user = await User.findOne({ refreshToken: refreshToken }).exec();
        if(!user) return res.status(403).json({message: `No user found. Invalid token`});

        const order = await Order.findOne({ _id: id }).exec();
        if(!order) return res.status(404).json({message: `No order found with the Id: ${id}`});
        if(user?.email !== order?.email) return res.status(400).json({message: 'You can delete only the orders you placed.'});
        if(order?.amountPaid > 0) return res.status(400).json({message: 'You can delete only orders with no payment'});

        await Order.deleteOne({ _id: id});
        res.status(200).json({message: 'Order successfully deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create,
    update,
    confirm,
    pay,
    getAll,
    getByUserId,
    getById,
    remove
};