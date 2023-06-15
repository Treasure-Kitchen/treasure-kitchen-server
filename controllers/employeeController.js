const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Position = require('../models/Position');
const Department = require('../models/Department');

const create = async (req, res) => {
    const { 
        firstName,
        lastName,
        middleName,
        position,
        department,
        salary,
        emailAddress,
        phoneNumber,
        role,
        employmentDate,
        password,
    } = req.body;

    //check for duplicated Employee
    const duplicate = await Employee.findOne({ emailAddress: emailAddress }).exec();
    if(duplicate) return res.status(409).json({'message':`Another Employee already registered with ${emailAddress}`});
    
    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        const roleFromDb = await Role.findOne({ role: role }).exec();
        const positionFromDB = await Position.findOne({ name: position }).exec();
        const departmentFromDB = await Department.findOne({ name: department }).exec();
        if(!roleFromDb) res.status(400).json({ 'message':`Role: ${role}, not found` });
        if(!positionFromDB) res.status(400).json({ 'message':`Role: ${position}, not found` });
        if(!departmentFromDB) res.status(400).json({ 'message':`Role: ${department}, not found` });
        
        //add new Employee
        const newEmployee = {
            "firstName": firstName,
            "lastName": lastName,
            "middleName": middleName,
            "emailAddress": emailAddress,
            "phoneNumber": phoneNumber,
            "role": role?.role,
            "password": hashedPwd,
            "position": position,
            "department": department,
            "salary": salary,
            "employmentDate": employmentDate
        }
        await Employee.create(newEmployee);
        res.status(201).json({ 'message': 'Employee Registration successful' });
    } catch (error) {
        res.status(500).json(({ 'message': error.message }));
    }
};

const updateName = async (req, res) => {
    const {
        firstName,
        lastName,
        middleName
    } = req.body;

    if(!firstName || !lastName) return res.status(400).json({ 'message': 'Please fill in the required fields.' });
    const id = req.params.id;

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
    const {
        position
    } = req.body;

    if(!position) return res.status(400).json({ 'message': 'Position is required.' });
    const id = req.params.id;

    try {
        const positionFromDB = await Position.findOne({ name: position });
        if(positionFromDB) return res.status(404).json({ 'message': `The Position: ${position}, does not exist`});

        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.position = position;

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
    const {
        salary
    } = req.body;

    if(!salary) return res.status(400).json({ 'message': 'Salary is required.' });
    if(salary <= 0) res.status(400).json({ 'message': 'Salary must be greater than 0.' });
    const id = req.params.id;

    try {
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.salary = salary;

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
    const {
        department
    } = req.body;

    if(!department) return res.status(400).json({ 'message': 'Department is required.' });
    const id = req.params.id;

    try {
        const departmentFromDB = await Department.findOne({ name: department });
        if(departmentFromDB) return res.status(404).json({ 'message': `The Department: ${department}, does not exist`});

        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.department = department;

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
    const {
        employmentDate
    } = req.body;

    if(!employmentDate) return res.status(400).json({ 'message': 'Employment Date is required.' });
    if((new Date()).getTime() < (new Date(employmentDate).getTime())) return res.status(400).json({ 'message':'Employment Date cannot be in the future' });
    const id = req.params.id;

    try {
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.employmentDate = employmentDate;

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
    const {
        role
    } = req.body;

    if(!role) return res.status(400).json({ 'message': 'Role is required.' });
    const id = req.params.id;

    try {
        const roleFromDB = await Role.findOne({ name: role }).exec();
        if(!roleFromDB) return res.status(404).json({ 'message': `Role: ${role}, not found` });
        const employeeToUpdate = await Employee.findOne({ _id: id }).exec();
        if(employeeToUpdate){
            employeeToUpdate.role = role;

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
    const id = req.params.id;

    try {
        const employeeToTerminate = await Employee.findOne({ _id: id });
        if(employeeToTerminate){
            employeeToTerminate.terminationDate = new Date();
            employeeToTerminate.isTerminated = true;
            employeeToTerminate.refreshToken = '';

            //Save changes
            employeeToTerminate.save();
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
    terminate
}