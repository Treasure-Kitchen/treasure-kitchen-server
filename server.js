const express = require('express')
const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
require('dotenv').config();
const fs = require('fs-extra');
const swaggerDoc = fs.readJsonSync('./api.json');
const os = require('os');
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/dbConnection');
const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middlewares/errorHandler');
const { logger, logEvents } = require('./middlewares/logEvents');
const PORT = process.env.PORT || 5500;

//Initialize Express
const app = express()

//Configure Swagger UI
app.use('api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

//Coneect to MongoDB
connectDB();

//Logger
app.use(logger)

//Use CORS
app.use(cors(corsOptions));

//Configure to use form-data
//Content-Type: application/x-www.form-urlencoded
app.use(express.urlencoded({ extended: true }));

//Middleware for cookies
app.use(cookieParser());

//Middleware for json
app.use(express.json());

//Register the routes
app.use('/api/employees', require('./routes/api/employee'));
app.use('/api/roles', require('./routes/api/role'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/dishes', require('./routes/api/dish'));
app.use('/api/menus', require('./routes/api/menu'));
app.use('api/orders', require('./routes/api/order'));

//Log errors
app.use(errorHandler);

//Connect to the Database
mongoose.connection.once('open', () => {
    console.log('Connected To MongoDB');
    app.listen(PORT, () => {
        logEvents(`Server running on ${PORT}.\t${os.type()} - ${os.version()}`, `evLog-${format(new Date(), 'yyyyMMdd-HH')}.txt`)
        console.log(`Server running on Port ${PORT}`);
    })
})