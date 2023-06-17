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
                const newMenu = {
                    "name": name,
                    "description": description,
                    "dishes": dishes
                };

                const menu = await Menu.create(newMenu);
                if(dishes.length > 0){
                    await Dish.updateMany(
                        { _id: { $in: dishes }},
                        { $push: { menus: menu._id }}
                    );
                }
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
            const menu = await Menu.findById({ _id: id }).select('dishes').populate({
                path: 'dishes'
            });
            if(!menu) return res.status(404).json({message: `No menu record found for Id: ${id}`});

            if(menu.dishes.length > 0){
                menu.dishes.forEach( async (dish) => {
                    dish.menus.splice(menu._id, 1);
                    await dish.save();
                });
            }

            menu.name = name;
            menu.description = description;
            menu.dishes = dishes;
            //Update chosen dishes
            if(dishes.length > 0){
                await Dish.updateMany(
                    { _id: { $in: dishes }},
                    { $push: { menus: menu._id }}
                );
            }
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
            const menu = await Menu.findById({ _id: id }).select('dishes');
            if(!menu) return res.status(404).json({message: `No menu record found for Id: ${id}`});

            if(menu.dishes.length > 0){
                menu.dishes.forEach( async (dish) => {
                    dish.menus?.splice(menu._id, 1);
                    await dish.save();
                });
            }

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
            const count = await Dish.countDocuments();

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
}

module.exports = {
    create,
    update,
    remove,
    getAll,
    getById
};