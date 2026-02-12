import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')){
        return res.status(401).json({message:'Token gerekli'});  
    }
    try {
        const token = auth.split(' ')[1];
        req.user=jwt.verify(token , process.env.JWT_SECRET);
        next();
    } catch  {
        res.status(401).json({message:'Geçersiz token'});
    }
};
