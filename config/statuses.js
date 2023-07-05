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
    "Placed": "Placed",
    "Cancelled": "Cancelled",
    "Confirmed": "Confirmed",
    "Completed": "Completed"
}

const paymentStatuses = {
    "Paid": "Paid",
    "NotPaid": "Not Yet Paid",
    "Partial": "Partial",
    "OverPaid": "Over Paid"
}

module.exports = {
    tableStatuses,
    reservationStatuses,
    orderStatuses,
    paymentStatuses
};