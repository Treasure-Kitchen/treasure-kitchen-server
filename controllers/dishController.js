const Dish = require('../models/Dish');
const Order = require('../models/Order');
const { toNumber,isNotANumber } = require('../helpers/helperFs');
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
            "publicId": result.public_id,
        };
        await Dish.create(newDish)
        res.status(200).json({message:'Dish successfully created.'});

    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const { 
        name,
        description,
        price
    } = req.body
    if(!name) return res.status(400).json({message: 'Dish Name is a required field.'});
    if(!description) return res.status(400).json({message: 'Description is required.'});
    if(isNotANumber(price)) return res.status(400).json({message: 'Invalid type for Price.'});
    if(toNumber(price) <= 0) return res.status(400).json({message: 'Price must be greater than 0.'});

    try {
        const dish = await Dish.findOne({ _id: id }).exec();
        if(!dish) return res.status(404).json({message: `No dish found with Id: ${id}`});

        dish.name = name;
        dish.description = description;
        dish.price = toNumber(price);
        //Save
        await dish.save();
        res.status(200).json({message: 'Dish details successfully updated.'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const dish = await Dish.findOne({ _id: id })
            .select('_id name description price photo')
            .exec();
        if(!dish) return res.status(404).json({message: `No dish found with the Id: ${id}`});
        res.status(200).json(dish);
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
                MetaData: {
                    CurrentPage: currentPage,
                    PageSize: pageSize,
                    TotalPages: Math.ceil(count / pageSize),
                    ItemCount: count
                }
            });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getManyByIds = async(req, res) => {
    const { ids } = req.params;
    try {
            const dishes = ids.split(',');
            if(dishes.length <= 0) return res.status(400).json({message: 'You must select at least, one dish item.'});
            const dishesFromDb = await Dish.find().where('_id').in(dishes).select('name description price photo');
            res.status(200).json(dishesFromDb);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const getSingleWithOrders = async(req, res) => {
    const { id } = req.params;
    try {
            let dish = await Dish.findOne({ _id: id });
            if(!dish) return res.status(404).json({message: `No Dish record found with Id: ${id}`});
            const orders = Order.find({ dishes: dish._id });
            dish.orders = orders;
            res.status(200).json(dish);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const remove = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Dish.findOneAndDelete({ _id: id });
        cloudinary.uploader.destroy(result.publicId, (result) => { console.log(result) });
        if(!result) return res.status(404).json({message: `No dish found with Id: ${id}`});
        res.status(200).json({message:'Dish successfully deleted'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getManyByIds,
    getSingleWithOrders
};