import jwt from "jsonwebtoken";

//MIDDLEWARE FOR AUTHERIZATION

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.Token ||  req.headers["authorization"]?.split(' ')[1];
        // console.log(token);
        if (!token){
            return res.status(401).json({
                message:"Unauthorized: No token provided",
                success: false
            });
        }
        
       const decoder = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoder;

       next();
    } catch (error) {
        console.error("Auth Middleware error", error);
        return res.status(401).json({
            message:"Unauthorized: Invalid token",
            success: false
        })
    }
}