const Menu = require('../models/Menu');
const Dish = require('../models/Dish');

const create = async (req, res) => {
    const { 
        name, 
        description, 
        dishes 
    } = req.body;
        if(!name || !description) return res.status(400).json({message:`Please fill in all the required fields.`});
        try {
                const dishCount = await Dish.countDocuments({
                    _id: { $in: dishes }
                });
                if(dishes.length !== dishCount) return res.status(404).json({message: `One or more chosen dishes could not be found.`});

                const newMenu = {
                    "name": name,
                    "description": description,
                    "dishes": dishes
                };

                await Menu.create(newMenu);
                res.status(200).json({message: 'Menu successfully created'});
        } catch (error) {
            res.status(500).json({message:error.message});
        }   
};

const update = async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        description, 
        dishes 
    } = req.body;
        if(!name || !description) return res.status(400).json({message:`Please fill in all the required fields.`});

        try {
                const menu = await Menu.findById({ _id: id });
                if(!menu) return res.status(404).json({message: `No menu record found for Id: ${id}`});
                const dishCount = await Dish.countDocuments({
                    _id: { $in: dishes }
                });
                if(dishes.length !== dishCount) return res.status(404).json({message: `One or more chosen dishes could not be found.`});

                menu.name = name;
                menu.description = description;
                menu.dishes = dishes;
                //Save
                await menu.save();
                res.status(200).json({message: 'Menu successfully updated'});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
};

const remove = async (req, res) => {
    const { id } = req.params;
    try {
            const menu = await Menu.findById({ _id: id });
            if(!menu) return res.status(404).json({message: `No menu record found for Id: ${id}`});
            if(menu.dishes) return res.status(400).json({message: 'You can not delete a menu that already has a list of dishes.'});

            await Menu.deleteOne({ _id: id });
            res.status(200).json({message: 'Menu successfully deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getAll = async (req, res) => {
    try {
            const result = await Menu.find()
                .select('_id name description dishes')
                .populate({
                    path: 'dishes',
                    select: '_id name description price photo'
                })  
                .sort({ _id: 1 })   
                .exec();

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({message: error.message});
        }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const menu = await Menu.findById({ _id: id })
            .select('_id name description dishes')
            .populate({
                path: 'dishes',
                select: '_id name description price photo'
            }).exec();

        if(!menu) return res.status(404).json({message: `No menu record found for Id: ${id}`});
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create,
    update,
    remove,
    getAll,
    getById
};