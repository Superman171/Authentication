//controller used for writing logic 
import { where } from "sequelize";
import { User } from "../db/dbConnection.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../controller/auth/auth.js"; 
//THIS CREATES PROBLEM after exporting it was working

//Two routes are working /register and /login
//refresh token are not adding in DB 


export const registerController = async (req,res) =>{
    try{
        const {username,email,password} = req.body;

        const existUsser = await User.findOne({where:{username}});
        
            //checking existing user
        if(existUsser){
            return res.status(409).json("user is already exist");
        }
            //hash password
        const hashedPass = await bcrypt.hash(password,10);
            //create new user
        const user = await User.create({
            username,
            email,
            password : hashedPass
        });
        return res.status(201).json(user);
    }
    catch(e){
        console.error(e);
        return res.status(500).json("Internal Server Problem");
    }
};


export const loginController = async (req,res) =>{
    try {
        const {username, password, email} = req.body;
        
        const exist = await User.findOne({where:{username}});
        if(exist){
            const isValid = await bcrypt.compare(password, exist.password);
            if(!isValid){
                return res.status(401).json("Credential Invalid");
            }
            // console.log(exist.dataValues);
            const accessToken = await generateAccessToken(exist.dataValues);
            const refreshToken = await generateRefreshToken(exist.dataValues);
            exist.update({refreshToken:refreshToken});
            return res.status(200).json({
                message:"User logged In",
                userData:{
                    username:exist.dataValues.username,
                    accessToken:accessToken,
                    refreshToken:refreshToken
                }
            });
        }
        else{
            return res.status(404).json("User is not exist");
        }

    } catch (error) {
        console.error("Login error",error);
        return res.status(500).json("Internal Server Problem");
    }
};