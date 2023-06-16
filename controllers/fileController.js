const cloudinary = require('../utils/cloudinary');
const Employee = require('../models/Employee');

const uploadEmployeePhoto = async (req, res) => {
    const userId = req.params.userId;
    try {
        const employee = await Employee.findOne({ _id: userId });
        if(!employee) return res.status(404).json({message:`No employee found with Id: ${userId}`});

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "treasure_kitchen",
            public_id: `${employee?._id}_profile`
        });
        employee.photoUrl = result.secure_url;
        employee.publicId = result.public_id;
        //save changes
        await employee.save();
        res.status(200).json({message:'Profile photo successfully uploaded.'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

module.exports = {
    uploadEmployeePhoto,
}