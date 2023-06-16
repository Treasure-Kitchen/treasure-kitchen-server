const express = require('express');
const router = express.Router();
const employeeController = require('../../controllers/employeeController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const validateEmployeeRequest = require('../../middlewares/validateEmployeeRequest');
const positionController = require('../../controllers/positionController');
const departmentController = require('../../controllers/departmentController');
const fileCOntroller = require('../../controllers/fileController');
const multer = require('multer');
const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    } else{
        cb("Invalid image file", false);
    }
};
const upload = multer({ storage, fileFilter });

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), validateEmployeeRequest, employeeController.create)
    .get(verifyJWT, employeeController.getAllEmployees);

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
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), positionController.create)
    .get(positionController.getAll);

router.route('/positions/:id')
    .put(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), positionController.update)
    .get(positionController.getById)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), positionController.remove);

router.route('/departments')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), departmentController.create)
    .get(departmentController.getAll);

router.route('/departments/:id')
    .put(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), departmentController.update)
    .get(departmentController.getById)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), departmentController.remove);

router.route('/:id/upload-photo')
    .post(verifyJWT, upload.single('image'), fileCOntroller.uploadEmployeePhoto);

module.exports = router