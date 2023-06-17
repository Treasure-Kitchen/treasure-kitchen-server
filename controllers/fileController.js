const cloudinary = require('../utils/cloudinary');
const Employee = require('../models/Employee');
const Dish = require('../models/Dish');
const { MAX_FILE_SIZE, allowedFileExt } = require('../helpers/helperFs');

const uploadEmployeePhoto = async (req, res) => {
    const userId = req.params.userId;
    const file = req.file;
    const fileExt = (file.mimetype).split('/')[1];
    const fileSize = file.size;

    if(fileSize > MAX_FILE_SIZE) return res.status(400).json({message: 'Maximum file size is 800 kilobytes.'});
    if(!allowedFileExt.includes(fileExt)) return res.status(400).json({message: 'Invalid file type. Must either be a .png, .jpg or .jpeg file.'});
    try {
        const employee = await Employee.findOne({ _id: userId });
        if(!employee) return res.status(404).json({message:`No employee found with Id: ${userId}`});

        const result = await cloudinary.uploader.upload(file.path, {
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

const updateDishImage = async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    const fileExt = (file.mimetype).split('/')[1];
    const fileSize = file.size;
    if(fileSize > MAX_FILE_SIZE) return res.status(400).json({message: 'Maximum file size is 800 kilo bytes.'});
    if(!allowedFileExt.includes(fileExt)) return res.status(400).json({message: 'Invalid file type. Must either be a .png, .jpg or .jpeg file.'});

    try {
            const dish = await Dish.findOne({ _id: id });
            if(!dish) return res.status(404).json({message: `No dish record found for Id: ${id}`});
            
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "treasure_kitchen",
                public_id: dish?.publicId
            });
    
            dish.photo = result.secure_url;
            dish.publicId = result.public_id;
            await dish.save();
            
            res.status(200).json({message: 'Dish image successfully updated.'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

module.exports = {
    uploadEmployeePhoto,
    updateDishImage
}