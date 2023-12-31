const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { orderStatuses, paymentStatuses } = require('../config/statuses');
const { toNumber, processPaymentStatus, validDateRange, minimumDate, maximumDate } = require('../helpers/helperFs');
const User = require('../models/User');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');
const OrderTrack = require('../models/OrderTrack');
const { addMilliseconds, millisecondsInHour } = require('date-fns');
const { cancelOrderIfNotConfirmed } = require('../utils/cronJobs');
const { sendOrderNotification } = require('../helpers/emailSlave');
const mongoose = require("mongoose")

const create = async (req, res) => {
    const userId = getLoggedInUserId(req);
    const {
        dishes,
        phoneNumber
    } = req.body;

    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with Id: ${userId}`});
            if(!user.address) return res.status(404).json({message: 'Please add an address in your profile to continue.'});

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
                customerAddress: user.address,
                dishes: dishes,
                paymentStatus: paymentStatuses.NotPaid
            });
            //Initialize Order Track
            const orderTrack = initOrderTrack(order);
            //Save Changes
            await order.save();
            await orderTrack.save()
            const threeDaysLater = addMilliseconds(order.dateTime, (millisecondsInHour * 24 * 3));
            cancelOrderIfNotConfirmed(order._id, threeDaysLater);
            res.status(200).json({id: order?._id, message: `Order created successfully. Pending payment. Please complete your order before ${threeDaysLater}.`});
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

            const previousOrderStatus = order.status;
            order.dishes = dishes;
            order.price = totalPrice;
            order.phoneNumber = phoneNumber;
            order.balance = (totalPrice - order.amountPaid);
            order.status = (order.price - toNumber(order.amountPaid)) === 0 || (order.price - toNumber(order.amountPaid) < 0) ? 
                orderStatuses.Placed : 
                orderStatuses.Pending;
            order.paymentStatus = processPaymentStatus(order, toNumber(order.amountPaid));
            if(previousOrderStatus !== order.status){
                const orderTrack = initOrderTrack(order);
                await orderTrack.save();
            }
            //Save
            await order.save();
            if(previousOrderStatus === orderStatuses.Cancelled){
                const threeDaysLater = addMilliseconds(Date.name, (millisecondsInHour * 24 * 3));
                cancelOrderIfNotConfirmed(order._id, threeDaysLater);
            }
            res.status(200).json({message: 'Order details successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//update on swagger doc
const pay = async (req, res) => {
    const { id } = req.params;

    try {
            const order = await Order.findOne({ _id: id }).populate('customer').exec();
            if(!order) return res.status(404).json({message: `Could not find an order with Id: ${id}`});
            if((order.paymentStatus === paymentStatuses.Paid && order.balance <= 0) || order.amountPaid === order.price) 
                return res.status(400).json({message: 'Order already process. Awaiting confirmation.'});

            //TODO: Process Payment here
            const paymentResult = processPayment(order, req)
            if(paymentResult.isSuccessful){
                const previousOrderStatus = order.status;
                //Update
                order.amountPaid = toNumber(order.price);
                order.balance = 0;
                order.status = orderStatuses.Confirmed;
                order.paymentStatus = processPaymentStatus(order, toNumber(order.amountPaid));

                //Initialize Order Track
                if(previousOrderStatus !== order.status){
                    const orderTrack = initOrderTrack(order);
                    await orderTrack.save();
                }

                //Send order details to the user email
                const payload = {
                    name: order.customer.displayName, 
                    price: order.price, 
                    date: order.dateTime, 
                    orderId: order._id, 
                    email: order.customer.email, 
                    subject: "Order Details"
                };
                await sendOrderNotification(payload);
                //Save
                await order.save();
                res.status(200).json({ message: 'Your order now on the way. We have sent the details to your mail.'})
            } else {
                return res.status(404).json({message: paymentResult.message });
            }
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
};

const getAll = async (req, res) => {
    const { page, perPage, status, payStatus, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
    const orderStatus = status ? 
                            [orderStatuses[status]] : 
                            [
                                orderStatuses.Pending, 
                                orderStatuses.Placed, 
                                orderStatuses.Cancelled, 
                                orderStatuses.Confirmed,
                                orderStatuses.Completed
                            ];
    const paymentStatus = payStatus ? 
                            [paymentStatuses[payStatus]] : 
                            [
                                paymentStatuses.Paid, 
                                paymentStatuses.NotPaid, 
                                paymentStatuses.Partial, 
                                paymentStatuses.OverPaid
                            ];
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
                     select: '_id name photo price description'
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
    const userId = getLoggedInUserId(req);
    const { page, perPage, status, payStatus, minDate, maxDate } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
    const orderStatus = status ? 
                            [orderStatuses[status]] : 
                            [
                                orderStatuses.Pending, 
                                orderStatuses.Placed, 
                                orderStatuses.Cancelled, 
                                orderStatuses.Confirmed,
                                orderStatuses.Completed
                            ];
    const paymentStatus = payStatus ? 
                            [paymentStatuses[payStatus]] : 
                            [
                                paymentStatuses.Paid, 
                                paymentStatuses.NotPaid, 
                                paymentStatuses.Partial, 
                                paymentStatuses.OverPaid
                            ];
    const mnDate = minDate ? new Date(minDate) : new Date(minimumDate);
    const mxDate = maxDate ? new Date(maxDate) : new Date(maximumDate);
    if(!validDateRange(mnDate, mxDate)) return res.status(400).json({message: 'Invalid date range'});
  
    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
            const result = await Order.find({ customer: user._id })
                 .where('status').in(orderStatus)
                 .where('paymentStatus').in(paymentStatus)
                 .where('dateTime').gte(mnDate).lte(mxDate)
                 .sort({ dateTime: -1 })
                 .select('_id status price amountPaid balance dateTime paymentStatus customer dishes')
                 .populate({
                     path: 'dishes',
                     select: '_id name photo price description'
                 })
                 .populate({
                     path: 'customer',
                     select: '_id displayName email phoneNumber'
                 })
                 .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                 .limit(pageSize)        
                 .exec();
             const count = await Order.countDocuments({ customer: user._id })
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
                        select: '_id name photo price description'
                    })
                    .populate({
                        path: 'customer',
                        select: '_id displayName email phoneNumber'
                    })
                    .populate('customerAddress')
                    .exec();
            if(!order) return res.status(404).json({message: `No order found with the Id: ${id}`});
            res.status(200).json(order);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const remove = async (req, res) => {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

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

const completeOrder = async (req, res) => {
    const { id } = req.params;
    try {
            const orderToConfirm = await Order.findOne({ _id: id }).populate('customer').exec();
            if(!orderToConfirm) return res.status(404).json({message: `No order found with Id: ${id}`});
            if(orderToConfirm.status !== orderStatuses.Confirmed) return res.status(400).json({message: `You can not moved order from ${orderToConfirm.status} to ${orderStatuses.Completed}`});
            if(orderToConfirm.price !== orderToConfirm.amountPaid || orderToConfirm.price > orderToConfirm.amountPaid) return res.status(400).json({message: `The order amount has to be fully paid to be completed.`});
            
            const previousOrderStatus = orderToConfirm.status;
            if(previousOrderStatus !== orderToConfirm.status){
                const orderTrack = initOrderTrack(orderToConfirm);
                await orderTrack.save();
            }
            //Update order
            orderToConfirm.status = orderStatuses.Completed;
            //Save
            orderToConfirm.save();
        res.status(200).json({message: 'Order successfully completed.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Add to swagger doc
const cancelOrder = async (req, res) => {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

    try {
            const orderToCancel = await Order.findOne({ _id: id, customer: userId }).populate("customer").exec();
            if(!orderToCancel) return res.status(404).json({message: `No order found with Id and UserId: ${id} and ${userId} respectively.`});
            if(orderToCancel.status === orderStatuses.Cancelled) return res.status(400).json({message: `Order already cancelled!`});
            if(orderToCancel.amountPaid > 0) return res.status(400).json({message: `You can not cancel this order.`});
            
            const previousOrderStatus = orderToCancel.status;
            //Update order
            orderToCancel.status = orderStatuses.Cancelled;

            if(previousOrderStatus !== orderToCancel.status){
                const orderTrack = initOrderTrack(orderToCancel);
                await orderTrack.save();
            }

            //Save
            orderToCancel.save();
        res.status(200).json({message: 'Order successfully Cancelled.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getOrderTrack = async (req, res) => {
    const { orderId } = req.params;
    const userId = getLoggedInUserId(req);
    try {
            const tracks = await OrderTrack.find({ userId: userId, orderId: orderId })
                                    .select('dateTime orderStatus')
                                    .sort({ dateTime: 1 }).exec();
            res.status(200).json(tracks)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const initOrderTrack = (order) => {
    return new OrderTrack({
        dateTime: new Date(),
        userId: order.customer,
        orderId: order._id,
        orderStatus: order.status
    });
}

const isUserHasOrders = async (req, res) => {
    const userId = getLoggedInUserId(req);
    
    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
            
            const count = await Order.countDocuments({ customer: user._id }).exec();
            res.status(200).json(count > 0 );
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const processPayment = (order, req) => {
    const { 
        cardNumber,
        cvv,
        expMonth,
        expYear
     } = req.body;

     if(!cardNumber || !cvv || !expMonth || !expYear) 
        return {
            isSuccessful: false,
            message: "Invalid request. Please enter the required details"
        };

    return {
        isSuccessful: true,
        message: "payment successfully processed."
    };
}

module.exports = {
    create,
    update,
    pay,
    getAll,
    getByUserId,
    getById,
    remove,
    cancelOrder,
    completeOrder,
    getOrderTrack,
    isUserHasOrders
};