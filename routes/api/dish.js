const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const multer = require('multer');
const dishController = require('../../controllers/dishController');
const fileController = require('../../controllers/fileController');
const validateDishRequest = require('../../middlewares/validateDishRequest');
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
    .post(verifyJWT, upload.single('image'), validateDishRequest, dishController.create)
    .get(verifyJWT, dishController.getAll);

router.route('/:id')
    .get(dishController.getById)
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), dishController.update)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), dishController.remove);

router.route(':id/update-image')
    .post(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), fileController.updateDishImage);

module.exports = router;