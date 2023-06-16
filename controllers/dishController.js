const Dish = require('../models/Dish');
const { toNumber } = require('../helpers/helperFs');
const cloudinary = require('../utils/cloudinary');

const create = async (req, res) => {
    const { 
        name,
        description,
        price
    } = req.body
    const file = req.file;
    
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "treasure_kitchen",
            public_id: `${file.filename}_dishes`
        });
    
        const newDish = {
            "name": name,
            "description": description,
            "price": toNumber(price),
            "photo": result.secure_url,
            "publicId": result.secure_url,
        };
        await Dish.create(newDish)
        res.status(200).json({message:'Dish successfully created.'});

    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const getAll = async (req, res) => {
    const {page, perPage } = req.query;
    const currentPage = Math.max(0, page) || 1;
    const pageSize = Number(perPage) || 10;
  
    try {
            const result = await Dish.find()
                .sort({ _id: 1 })
                .select('_id name description price photo')
                .skip((parseInt(currentPage) - 1) * parseInt(pageSize))
                .limit(pageSize)        
                .exec();
            const count = await Dish.countDocuments();

            res.status(200).json({
                Data: result,
                CurrentPage: currentPage,
                PageSize: pageSize,
                TotalPages: Math.ceil(count / pageSize)
            });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create,
    getAll
};