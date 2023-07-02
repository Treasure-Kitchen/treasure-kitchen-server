const { isNotANumber, toNumber, MIN_DURATION, MAX_DURATION, FIVE, FIFTY } = require("../helpers/helperFs");

const verifyDuration = (req, res, next) => {
    const {
        inWords,
        inFigure
    } = req.body;
    const inFigureToNum = toNumber(inFigure);
    if(!inWords) return res.status(400).json({message: 'Duration in words is required.'});
    if(isNotANumber(inFigure)) return res.status(400).json({message: 'Duration in figure is required and should be a valid number'});

    const inFigureToString = inFigure.toString();
    if(inFigureToString.includes('.')){
        const splitted = inFigureToString.split('.');
        if(splitted.length > 2) return res.status(400).json({message: `${inFigure} is an invalid entry for duration in figure`});
        if(toNumber(splitted[1]) !== FIVE) return res.status(400).json({message: 'Duration minutes must be exactly 30 minutes'});
        if(splitted[0] < 0 || splitted[0] >= MAX_DURATION) return res.status(400).json({message: `Duration hour must be between ${0} and ${MAX_DURATION - 1}`});
    } else {
        if(inFigureToNum <= 0 || inFigureToNum > MAX_DURATION) return res.status(400).json({message: `Duration hour must be between 30 minutes and ${MAX_DURATION} hours.`});
    }
    next()
};

module.exports = verifyDuration;