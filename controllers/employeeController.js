const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Position = require('../models/Position');
const Department = require('../models/Department');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { isNotANumber, toNumber, capitalizeFirstLetters, emailConfirmationMessage } = require('../helpers/helperFs');
const { addHours } = require('date-fns');
const { sendConfirmationEmail } = require('../helpers/emailSlave');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');

const create = async (req, res) => {
    const origin = req.headers.origin;
    const { 
        firstName,
        lastName,
        middleName,
        positionId,
        departmentId,
        salary,
        emailAddress,
        phoneNumber,
        roleId,
        employmentDate,
        password,
    } = req.body;

    //check for duplicated Employee
    const duplicate = await Employee.findOne({ emailAddress: emailAddress }).exec();
    if(duplicate) return res.status(409).json({'message':`Another Employee already registered with ${emailAddress}`});
    
    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        const roleFromDb = await Role.findOne({ _id: roleId }).exec();
        const positionFromDB = await Position.findOne({ _id: positionId }).exec();
        const departmentFromDB = await Department.findOne({ _id: departmentId }).exec();
        if(!roleFromDb) return res.status(400).json({ 'message':`Role with Id: ${roleId}, not found` });
        if(!positionFromDB) return res.status(400).json({ 'message':`Position with Id: ${positionId}, not found` });
        if(!departmentFromDB) return res.status(400).json({ 'message':`Department with Id: ${departmentId}, not found` });
        
        const emailToken = crypto.randomBytes(64).toString("hex");
        //Initialize new Employee
        const employee = new Employee({
            firstName: capitalizeFirstLetters(firstName),
            lastName: capitalizeFirstLetters(lastName),
            middleName: capitalizeFirstLetters(middleName),
            emailAddress: emailAddress,
            phoneNumber: phoneNumber,
            role: roleFromDb._id,
            password: hashedPwd,
            position: positionFromDB._id,
            department: departmentFromDB._id,
            salary: toNumber(salary),
            employmentDate: new Date(employmentDate),
            emailToken: emailToken,
            tokenExpiryTime: addHours(new Date(), 2)
        });

        const link = `${origin}/verify-email?token=${emailToken}`;
        //Send confirmation email
        const payload = {
            name: employee.firstName,
            email: employee.emailAddress,
            subject: "Confirm Email",
            messageText: emailConfirmationMessage(),
            file: "ConfirmEmail.html",
            link: link
        }
        await sendConfirmationEmail(payload);
        //Save
        await employee.save();
        res.status(201).json({ 'message': 'Employee Registration successful.' });
    } catch (error) {
        res.status(500).json(({ 'message': error.message }));
    }
};

const getAllEmployees = async (req, res) => {
    const {page, perPage } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
  
    try {
            const result = await Employee.find()
                .sort({ firstName: 1 })
                .select('_id firstName lastName middleName position department salary emailAddress phoneNumber role isTerminated employmentDate createdAt lastLogin photoUrl terminationDate')
                .populate('position department role')
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Employee.countDocuments();
            res.status(200).json({
                Data: result,
                CurrentPage: currentPage,
                PageSize: pageSize,
                TotalPages: Math.ceil(count / pageSize),
                ItemCount: count
            });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const updateName = async (req, res) => {
    const { id } = req.params;

    const {
        firstName,
        lastName,
        middleName
    } = req.body;

    if(!firstName || !lastName) return res.status(400).json({ 'message': 'Please fill in the required fields.' });
    try {
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.firstName = firstName;
            employeeToUpdate.lastName = lastName;
            employeeToUpdate.middleName = middleName;

            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employee names updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const updatePosition = async (req, res) => {
    const { id, posId } = req.params;
    try {
        const positionFromDB = await Position.findOne({ _id: posId }).exec();
        if(!positionFromDB) return res.status(404).json({ 'message': `The Position with Id: ${posId}, does not exist`});

        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.position = positionFromDB._id;

            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employee position updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const updateSalary = async (req, res) => {
    const id = req.params.id;
    const {
        salary
    } = req.body;

    if(isNotANumber(salary)) return res.status(400).json({ 'message': 'Salary is required. Please enter a valid value.' });
    if(toNumber(salary) <= 0) res.status(400).json({ 'message': 'Salary must be greater than 0.' });

    try {
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.salary = toNumber(salary);

            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employee salary updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const updateDepartment = async (req, res) => {
    const { id, dptId } = req.params;
    try {
        const departmentFromDB = await Department.findOne({ _id: dptId }).exec();
        if(!departmentFromDB) return res.status(404).json({ 'message': `No department found with Id: ${dptId}`});

        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.department = departmentFromDB._id;

            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employee department updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const updateEmploymentDate = async (req, res) => {
    const { id } = req.params;
    const {
        employmentDate
    } = req.body;

    if(!employmentDate) return res.status(400).json({ 'message': 'Employment Date is required.' });
    if((new Date()).getTime() < (new Date(employmentDate).getTime())) return res.status(400).json({ 'message':'Employment Date cannot be in the future' });
    try {
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.employmentDate = new Date(employmentDate);
            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employment Date updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const changeEmployeeRole = async (req, res) => {
    const { id, roleId } = req.params;
    try {
        const roleFromDB = await Role.findOne({ _id: roleId }).exec();
        if(!roleFromDB) return res.status(404).json({ 'message': `Role with Id: ${roleId}, not found` });
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.role = roleFromDB._id;

            await employeeToUpdate.save();
            res.status(200).json({ 'message': 'Employee Role updated successfully.' });
        } else {
            res.status(404).json({ 'message': `No employee with Id: ${id}`});
        }
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
};

const terminate = async (req, res) => {
    const loggedInUserId = getLoggedInUserId(req);
    const { id } = req.params;

    try {
        const employeeToTerminate = await Employee.findOne({ _id: id });
        if(employeeToTerminate){
            if(id === loggedInUserId) return res.status(403).json({message: 'You can not perform this operation on yourself.'});
            employeeToTerminate.terminationDate = new Date();
            employeeToTerminate.isTerminated = true;
            employeeToTerminate.refreshToken = '';
            employeeToTerminate.role = null;
            //Save changes
            await employeeToTerminate.save();
            res.status(200).json({message: `Successfully terminated ${employeeToTerminate.firstName} ${employeeToTerminate.lastName}.`})
        } else {
            res.status(404).json({ 'message': `No Employee found with Id: ${id}` });
        }
    } catch (error) {
        
    }
};

const reinstate = async (req, res) => {
    const { id, roleId } = req.params;

    try {
        const employeeToReinstate = await Employee.findOne({ _id: id });
        if(employeeToReinstate){
            const role = await Role.findOne({ _id: roleId }).exec();
            if(!role) return res.status(404).json({message: `No role found with the Id: ${roleId}`});
            employeeToReinstate.isTerminated = false;
            employeeToReinstate.role = role._id;
            //Save changes
            await employeeToReinstate.save();
            res.status(200).json({message: `Successfully reinstated ${employeeToReinstate.firstName} ${employeeToReinstate.lastName}.`})
        } else {
            res.status(404).json({ 'message': `No Employee found with Id: ${id}` });
        }
    } catch (error) {
        
    }
};

module.exports = {
    create,
    updateName,
    updatePosition,
    updateSalary,
    updateDepartment,
    updateEmploymentDate,
    changeEmployeeRole,
    terminate,
    reinstate,
    getAllEmployees
}