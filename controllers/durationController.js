const Duration = require('../models/Duration');

const create = async(req, res) => {
    const {
        inWords,
        inFigure
    } = req.body;

    try {
            const newDuration = {
                "inWords": inWords,
                "inFigure": inFigure
            };

            await Duration.create(newDuration);
            res.status(201).json({message: 'Duration successfully added'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const update = async(req, res) => {
    const { id } = req.params;
    const {
        inWords,
        inFigure
    } = req.body;

    try {
            const durationFromDb = await Duration.findOne({ _id: id });
            if(!durationFromDb) return res.status(404).json({message: `no duration found with Id: ${id}`});

            durationFromDb.inWords = inWords;
            durationFromDb.inFigure = inFigure;
            await durationFromDb.save();

            res.status(200).json({message: 'Duration successfully updated.'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getAll = async(req, res) => {
    try {
            const durations = await Duration.find().sort({ inFigure: 1 });
            res.status(200).json(durations);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const remove = async(req, res) => {
    const { id } = req.params;
    
    try {
            const duration = await Duration.findOne({ _id: id });
            if(!duration) return res.status(404).json({message: `No duration record with Id: ${id}.`});

            await Duration.deleteOne({ _id: id });
            res.status(200).json({message: 'Duration successfully deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    create,
    update,
    getAll,
    remove
}