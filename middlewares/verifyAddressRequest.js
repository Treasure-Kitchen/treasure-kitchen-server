const verifyAddressRequest = (req, res, next) => {
    const {
        line1,
        locality,
        adminArea,
        postalCode,
        country
    } = req.body;
    if(!line1) return res.status(400).json({message: 'Address line 1 is required.'});
    if(!locality) return res.status(400).json({message: 'City/Locality is required.'});
    if(!adminArea) return res.status(400).json({message: 'State/Administrative Area is required.'});
    if(!postalCode) return res.status(400).json({message: 'Zip/Postal Code is required.'});
    if(!country) return res.status(400).json({message: 'Country is required.'});

    next();
};

module.exports = verifyAddressRequest;