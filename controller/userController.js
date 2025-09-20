//controller used for writing logic 
import { where } from "sequelize";
import { User } from "../Database/dbConnection.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";


const registerController = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {

            return res.status(400).json({

                message: "All fields are required"
            });
        } else if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({

                message: "Invalid email format"

            })
        }
    }
    catch (e) {

        return res.status(400).json({
            message: "Server Down",
            error
        })
    }

    try {

        const existUser = await User.findOne({ where: { email } });

        //checking existing user
        if (existUser) {
            return res.status(409).json({

                message: "User already exists"
            });
        }
        //hash password
        const hashedPass = await bcrypt.hash(password, 10);
        //create new user
        const newuser = await User.create({
            username,
            email,
            password: hashedPass
        });

        console.log("New user created:", newuser);

        if (!newuser) {
            return res.status(400).json({
                message: "User not registered"
            })
        }

        const ver_token = crypto.randomBytes(32).toString("hex");
        newuser.verficationToken = ver_token;
        await newuser.save();

        // send verification email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: newuser.email,
            subject: "Email Verification",
            html: `<p>Click <a href="${process.env.BASE_URL}/verify/${ver_token}">here</a> to verify your email.</p>`
        }
        await transporter.sendMail(mailOptions)
        return res.status(201).json({
            message: "Please verify your email to login",
            success: true
        });
    }

    catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "User registration failed",
            error: e.message
        });
    }
};

const User_verified = async (req, res) => {
    const { ver_token } = req.params;
    try {
        const user = await User.findOne({
            where: { verficationToken: ver_token }
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid verification token"
            });
        }

        user.isverified = true;
        user.verficationToken = undefined;
        await user.save();

        return res.status(200).json({
            message: "Email verified successfully",
            success: true
        })
    }
    catch (e) {
        return res.status(500).json({
            message: "Email verification failed",
            error: e.message
        });
    }
};

const loginController = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        const exist = await User.findOne({ where: { email } });
        if (exist) {
            const isValid = await bcrypt.compare(password, exist.password);
            if (!isValid) {
                return res.status(401).json("Credential Invalid");
            }
            if (!exist.isverified) {
                return res.status(401).json({
                    message: "Please verify your email to login",
                    success: false
                })
            }

            const Jwt_token = jwt.sign({
                id: exist.id,
                username: exist.username,
                email: exist.email
            },
                process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            const cookiesOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            }

            res.cookies("Token", Jwt_token, cookiesOptions);

            return res.status(200).json({
                message: "Login Successful",
                success: true,
                exist: {
                    id: exist.id,
                    username: exist.username,
                    email: exist.email,
                    isverified: exist.isverified
                }

            })
        }
    } catch (error) {
        console.error("Login error", error);
        return res.status(500).json("Internal Server Problem");
    }
};
const logoutController = (req, res) => {

    res.clearCookie("token");
    return res.status(200).json({
        message: "Logout Successful",
        success: true
    })
};
const forgetPasswordController = async (req, res) => {

    const { email } = req.body;
    try {

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const rest_token = crypto.hash(32).toString("hex");
        user.resetPasswordToken = rest_token;
        user.resetPasswordExpires = Date.now() + 3600000; //1 hour
        await user.save();

        //send reset email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: "Reset Password",
            html: `<p>Click <a href="${process.env.BASE_URL}/reset-password/${rest_token}">here</a> to reset your password. This link is valid for 1 hour.</p>`
        }
        await transporter.sendMail(mailOptions);
        return res.status(200).json({
            message: "Password reset email sent",
            success: true
        });

    } catch (error) {
        console.error("Error sending password reset email", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};
const resetPasswordController = async (req, res) => {
    const { reset_token } = req.params;
    const { new_password } = req.body;

    try {
        const user = await User.findOne({
            where: {
                resetPasswordToken: reset_token,
                resetPasswordExpires: { $gt: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token",
                success: false
            });
        }
        const hashedPass = await bcrypt.hash(new_password, 10);
        user.password = hashedPass;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

    } catch (error) {
        console.error("Error resetting password", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};


export {
    registerController,
    User_verified,
    loginController,
    logoutController,
    forgetPasswordController,
    resetPasswordController
};