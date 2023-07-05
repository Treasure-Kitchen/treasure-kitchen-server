const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { orderStatuses, paymentStatuses } = require('../config/statuses');
const { isNotANumber, toNumber, processPaymentStatus, validDateRange, minimumDate, maximumDate } = require('../helpers/helperFs');
const User = require('../models/User');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');
const OrderTrack = require('../models/OrderTrack');
const { sendOrderNotification } = require('../helpers/emailSlave');
const { addMilliseconds, millisecondsInHour } = require('date-fns');
const { cancelOrderIfNotConfirmed } = require('../utils/cronJobs');

const create = async (req, res) => {
    const userId = getLoggedInUserId(req);
    const {
        dishes,
        phoneNumber
    } = req.body;

    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with Id: ${userId}`});

            const dishesFromDb = await Dish.find({
                _id: { $in: dishes }
            }).exec();
            //calculate the price
            let totalPrice = 0;
            dishesFromDb.forEach((dish) => {
                totalPrice += dish.price;
            })
            //Initialize new Order
            const order = new Order({
                phoneNumber: phoneNumber,
                price: totalPrice,
                balance: totalPrice,
                customer: user._id,
                dishes: dishes,
                paymentStatus: paymentStatuses.No
            });
            //Initialize Order Track
            const orderTrack = new OrderTrack({
                userId: user._id,
                orderId: order._id,
                dateTime: order.dateTime,
                orderStatus: order.status
            });
            //Save Changes
            await order.save();
            await orderTrack.save()
            const threeDaysLater = addMilliseconds(order.dateTime, (millisecondsInHour * 24 * 3));
            cancelOrderIfNotConfirmed(order._id, threeDaysLater);
            res.status(200).json({message: `Order created successfully. Pending payment. Please complete your order before ${threeDaysLater}.`});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
};

const update = async (req, res) => {
    const { id } = req.params;
    const {
        dishes,
        phoneNumber
    } = req.body;

    try {
            const order = await Order.findOne({ _id: id }).exec();
            if(!order) return res.status(404).json({message: `Could not find an order with Id: ${id}`});
            if(order.status === orderStatuses.Completed) return res.status(400).json({message: `Completed orders can not be updated.`});
            const userId = order.customer;
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with Id: ${userId}.`});

            const dishesFromDb = await Dish.find({
                _id: { $in: dishes }
            }).exec();
            let totalPrice = 0;
            dishesFromDb.forEach((dish) => {
                totalPrice += dish.price;
            });

            order.dishes = dishes;
            order.price = price;
            order.phoneNumber = phoneNumber;
            order.balance = (price - order.amountPaid);
            //Save
            await order.save();
            // const payload = {
            //     name: user.displayName, 
            //     price: order.price, 
            //     date: order.dateTime, 
            //     orderId: order._id, 
            //     email: user.email, 
            //     subject: "Order Details"
            // };
            //await sendOrderNotification(payload);
            res.status(200).json({message: 'Order details successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
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
                .select('_id status price amountPaid balance dateTime paymentStatus customer dishes')
                .populate({
                    path: 'dishes',
                    select: '_id name'
                })
                .populate({
                    path: 'customer',
                    select: '_id displayName email phoneNumber'
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
    const orderStatus = status ? [status] : [orderStatuses.Pending, orderStatuses.InProgress, orderStatuses.Completed, orderStatuses.Fulfilled];
    const paymentStatus = payStatus ? [payStatus] : [paymentStatuses.Yes, paymentStatuses.No, paymentStatuses.Partial, paymentStatuses.OverPaid];
    const mnDate = minDate ? new Date(minDate) : new Date(minimumDate);
    const mxDate = maxDate ? new Date(maxDate) : new Date(maximumDate);
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});

            const result = await Order.find({ customer: userId })
                .where('status').in(orderStatus)
                .where('paymentStatus').in(paymentStatus)
                .where('dateTime').gte(mnDate).lte(mxDate)
                .sort({ dateTime: -1 })
                .select('_id status price amountPaid balance dateTime paymentStatus customer dishes')
                .populate({
                    path: 'dishes',
                    select: '_id name'
                })
                .populate({
                    path: 'customer',
                    select: '_id displayName email phoneNumber'
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
                    .select('_id status price amountPaid balance dateTime paymentStatus customer dishes')
                    .populate({
                        path: 'dishes',
                        select: '_id name'
                    })
                    .populate({
                        path: 'customer',
                        select: '_id displayName email phoneNumber'
                    })
                    .exec();
            if(!order) return res.status(404).json({message: `No order found with the Id: ${id}`});
            res.status(200).json(order);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const remove = async (req, res) => {
    const { id } = req.params;
    const userId = req.user;

    try {
        const user = await User.findOne({ _id: userId }).exec();
        if(!user) return res.status(401).json({message: `No user found. Invalid token`});

        const order = await Order.findOne({ _id: id, customer: userId }).exec();
        if(!order) return res.status(404).json({message: `No order found with the Id: ${id} and placed by a customer with Id: ${userId}`});
        if(order.status === orderStatuses.Completed) return res.status(400).json({message: `You can not delete an already completed order.`});
        if(order?.amountPaid > 0) return res.status(400).json({message: 'You can delete only orders with no payment'});

        await Order.deleteOne({ _id: id });
        res.status(200).json({message: 'Order successfully deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create,
    update,
    pay,
    getAll,
    getByUserId,
    getById,
    remove
};