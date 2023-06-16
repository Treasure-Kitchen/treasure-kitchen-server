const { MAX_FILE_SIZE, allowedFileExt, toNumber, isNotANumber } = require('../helpers/helperFs');

const validateDishRequest = (req, res, next) => {
    const { 
        name,
        description,
        price
    } = req.body
    const file = req.file;
    const fileExt = (file.mimetype).split('/')[1];
    const fileSize = file.size;
   
    if(!name) return res.status(400).json({message: 'Dish Name is a required field.'});
    if(!description) return res.status(400).json({message: 'Description is required.'});
    if(isNotANumber(price)) return res.status(400).json({message: 'Invalid type for Price.'});
    if(toNumber(price) <= 0) return res.status(400).json({message: 'Price must be greater than 0.'});
    if(fileSize > MAX_FILE_SIZE) return res.status(400).json({message: 'Maximum file size is 800 kilo bytes.'});
    if(!allowedFileExt.includes(fileExt)) return res.status(400).json({message: 'Invalid file type. Must either be a .png, .jpg or .jpeg file.'});

    next();
};

module.exports = validateDishRequest;