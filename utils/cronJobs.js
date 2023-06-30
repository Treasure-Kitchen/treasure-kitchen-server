const cron = require('node-cron');

const changeTableStatus = async(id, status, dateTime) => {
    cron.schedule("* * * * *", () => {
        //Method to run goes here
        console.log(`Changed the Table status to ${status} at ${new Date(dateTime)}`);
    });
};

module.exports = {
    changeTableStatus
}