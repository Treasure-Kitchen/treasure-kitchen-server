const express = require('express');
const router = express.Router();
const employeeController = require('../../controllers/employeeController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const validateEmployeeRequest = require('../../middlewares/validateEmployeeRequest');
const positionController = require('../../controllers/positionController');
const departmentController = require('../../controllers/departmentController');

router.route('/')
    .post(validateEmployeeRequest, employeeController.create);

router.route('/:id/update-name')
    .patch(verifyJWT, employeeController.updateName);
    
router.route('/:id/update-department')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), employeeController.updateDepartment);

router.route('/:id/update-role')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin), employeeController.changeEmployeeRole);

router.route('/:id/terminate')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin), employeeController.terminate);

router.route('/:id/update-position')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin), employeeController.updatePosition);

router.route('/:id/update-department')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), employeeController.updateDepartment);

router.route('/:id/update-salary')
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin), employeeController.updateSalary)

router.route('/positions')
    .post(positionController.create)
    .get(positionController.getAll);

router.route('/positions/:id')
    .put(positionController.update)
    .get(positionController.getById)
    .delete(positionController.remove);

    router.route('/departments')
    .post(departmentController.create)
    .get(departmentController.getAll);

router.route('/departments/:id')
    .put(departmentController.update)
    .get(departmentController.getById)
    .delete(departmentController.remove);

module.exports = router