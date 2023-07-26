const Address = require('../models/Address');
const User = require('../models/User');
const { getLoggedInUserId } = require('../utils/getClaimsFromToken');

const create = async (req, res) => {
    const userId = getLoggedInUserId(req);
    const {
        line1,
        line2,
        locality,
        adminArea,
        postalCode,
        country
    } = req.body;

    try {
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});

            const address = new Address({
                line1: line1,
                line2: line2,
                locality: locality,
                adminArea: adminArea,
                postalCode: postalCode,
                country: country
            });
            user.address = address._id;
            //Save
            await user.save();
            await address.save();
            res.status(200).json({message: 'Address added successfully.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const {
        line1,
        line2,
        locality,
        adminArea,
        postalCode,
        country
    } = req.body;

    try {
            const address = await Address.findOne({ _id: id }).exec();
            if(!address) return res.status(404).json({message: `No address record found with the Id: ${id}`});
            //Update
            address.line1 = line1;;
            address.line2 = line2;
            address.locality = locality;
            address.adminArea = adminArea;
            address.postalCode = postalCode;
            address.country = country;
            //Save
            await address.save();
            res.status(200).json({message: 'Address successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
            const address = await Address.findOne({ _id: id}).exec();
            if(!address) return res.status(404).json({message: `No address record found for Id: ${id}`});
            res.status(200).json(address);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const remove = async (req, res) => {
    const userId = getLoggedInUserId(req);
    const { id } = req.params;
    try {
            const address = await Address.findOne({ _id: id}).exec();
            if(!address) return res.status(404).json({message: `No address record found for Id: ${id}`});
            const user = await User.findOne({ _id: userId }).exec();
            if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});

            await Address.deleteOne({ _id: id });
            user.address = null;
            await user.save();
            res.status(200).json({message: 'Address successfully deleted.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = {
    create,
    update,
    getById,
    remove
}