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
    "InProgress": "In Progress",
    "Cancelled": "Cancelled",
    "Completed": "Completed",
    "Fulfilled": "Fulfilled"
}

const paymentStatuses = {
    "Yes": "Yes",
    "No": "No",
    "Partial": "Partial",
    "OverPaid": "Over Paid"
}

module.exports = {
    tableStatuses,
    reservationStatuses,
    orderStatuses,
    paymentStatuses
};