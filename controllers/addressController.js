const Address = require('../models/Address');
const Country = require('../models/Country');
const State = require('../models/State');
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

//Country Section
const createCountry = async (req, res) => {
    const { name } = req.body;
    try {
            if(!name) return res.status(400).json({message: 'Country name is required.'});
            const newCountry = new Country({
                name: name
            });

            //save
            await newCountry.save();
            res.status(201).json({message: `Country: ${name}, successfully created.`});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const updateCountry = async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    try {
            if(!name) return res.status(400).json({message: "Country name is required."});
            const country = await Country.findOne({_id: id }).exec();
            if(!country) return res.status(404).json({message: `No country found with Id: ${id}`});
            //update
            country.name = name;
            //save
            await country.save();
            res.status(200).json({message: 'Country record successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const removeCountry = async (req, res) => {
    const { id } = req.params;
    try {
            const country = await Country.findOne({ _id: id }).exec();
            if(!country) return res.status(404).json({message: `No country found with Id: ${id}`});
            if(country.states.length > 0) return res.status(400).json({message: 'You can not delete this record because it already has dependent records. Please edit instead.'});
            
            await Country.deleteOne({ _id: id});
            res.status(200).json({message: 'Country record successfully deleted.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const getCountries = async (req, res) => {
    try {
            const countries = await Country.find().sort({name: 1}).select('_id name');
            res.status(200).json(countries);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const getCountryById = async (req, res) => {
    const { id } = req.params;

    try {
            const country = await Country.findOne({ _id : id })
                .select('_id name states')
                .populate({
                    path: 'states',
                    select: '_id name'
                }).exec();

            if(!country) return res.status(404).json({message: `No country found with Id: ${id}`});
            res.status(200).json(country);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

//State Section
const createState = async (req, res) => {
    const { name, countryId } = req.body;

    try {
            const country = await Country.findOne({ _id: countryId }).exec();
            if(!country) return res.status(404).json({message: `No country found with Id: ${countryId}`});
            if(!name) return res.status(400).json({message: 'State name is required.'});

            //create state
            const newState = new State({
                name: name,
                country: country._id
            });

            //update country
            country.states.push(newState._id);
            //save
            await country.save();
            await newState.save();

            res.status(200).json({message: `State: ${name}, successfully created.`});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const updateState = async (req, res) => {
    const { id } = req.params;
    const { name, countryId } = req.body;

    try {
            const state = await State.findOne({ _id: id }).exec();
            if(!state) return res.status(404).json({message: `No state found with Id: ${id}`});
            const country = await Country.findOne({ _id: countryId }).exec();
            if(!country) return res.status(404).json({message: `No country found with Id: ${countryId}`});
            if(!name) return res.status(400).json({message: 'State name is required.'});

            //update state and country if a different country is selected
            if(state.country !== countryId){
                const formerCountry = await Country.findOne({_id: state.country}).exec();
                if(formerCountry){
                    //remove the state from thr country
                    formerCountry.states = formerCountry.states.filter((st) => {
                        return st.toString() !== state._id.toString();
                    });
                    //save the update
                    await formerCountry.save();
                }
                //update the state with the new country
                state.country = countryId;
            }

            //update the state name
            state.name = name;
            //update new country
            country.states.push(state._id);
            //save
            await country.save();
            await state.save();

            res.status(200).json({message: `State successfully updated.`});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const removeState = async (req, res) => {
    const { id } = req.params;
     try {
            const state = await State.findOne({_id: id}).exec();
            if(!state) return res.status(404).json({message: `No state found with Id: ${id}`});

            const country = await Country.findOne({_id: state.country}).exec();
            if(!country) return res.status(404).json({message: "Test error message"});
            if(country){
                country.states = country.states.filter((st) => {
                    return st.toString() !== state._id.toString();
                });

                //save
                await country.save();
            }

            await State.deleteOne({_id: id});
            res.status(200).json({message: "State record successfully deleted."});
     } catch (error) {
        res.status(500).json({message: error.message});
     }
}

const getStateById = async (req, res) => {
    const { id } = req.params;

    try {
            const state = await State.findOne({_id: id}).select('_id name').exec();
            if(!state) return res.status(404).json({message: `No state found with Id: ${id}`});

            res.status(200).json(state);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

const getStatesByCountry = async (req, res) => {
    const { countryId } = req.params;

    try {
            const states = await State.find({country: countryId}).sort({name: 1}).select('_id name country').exec();
            res.status(200).json(states);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = {
    create,
    update,
    getById,
    remove,
    createState,
    updateState,
    removeState,
    getStateById,
    createCountry,
    updateCountry,
    removeCountry,
    getCountries,
    getCountryById,
    getStatesByCountry
}