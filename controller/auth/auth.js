import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateAccessToken = async (user) =>{
    const token = jwt.sign({username:user.username}, process.env.ACCESS_TOKEN_SECRET ,{expiresIn:"20min"});
    return token;
}

export const generateRefreshToken = async (user) =>{
    const token = jwt.sign({username:user.username}, process.env.REFRESH_TOKEN_SECRET ,{expiresIn:"7d"});
    return token;
}