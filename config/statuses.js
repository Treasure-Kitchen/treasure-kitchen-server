const tableStatuses = {
    "Available": "Available",
    "Occupied": "Occupied",
    "Reserved": "Reserved"
};

const reservationStatuses = {
    "Pending": "Pending",
    "Confirmed": "Confirmed",
    "Cancelled": "Cancelled"
};

const orderStatuses = {
    "Pending": "Pending",
    "Placed": "Order Placed",
    "Cancelled": "Cancelled",
    "Confirmed": "Confirmed",
    "Shipped": "Shipped",
    "Fulfilled": "Fulfilled"
}

const paymentStatuses = {
    "Paid": "Paid",
    "No": "Not Paid",
    "Partial": "Partial",
    "OverPaid": "Over Paid"
}

module.exports = {
    tableStatuses,
    reservationStatuses,
    orderStatuses,
    paymentStatuses
};