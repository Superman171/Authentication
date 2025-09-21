//controller used for writing logic 
import { Op, where } from "sequelize";
import { User } from "../Database/dbConnection.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { text } from "stream/consumers";

//USER REGISTRATION 
const registerController = async (req, res) => {
    //creating constants
    const { username, email, password } = req.body;
    
    //checking the fields
        if (!username || !email || !password) {

            return res.status(400).json({

                message: "All fields are required"
            });
        } else if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({
                message: "Invalid email format"
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

        console.log("New user created:", newuser.toJSON());

        if (!newuser) {
            return res.status(400).json({
                message: "User not registered"
            })
        }

        const ver_token = crypto.randomBytes(32).toString("hex");
        // console.log(ver_token);
        newuser.verificationToken = ver_token;
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
        });

        const mailOptions = {
            from: process.env.SMTP_SEND_EMAIL,
            to: newuser.email,
            subject: "Email Verification",
            text: `<p>Click ${process.env.BASE_URL}/verify/${ver_token}here to verify your email.</p>`
        };
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

//USER VERIFICATION
const User_verified = async (req, res) => {
    const { ver_token } = req.params;
    try {
        const user = await User.findOne({
            where: { verificationToken: ver_token }
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid verification token"
            });
        }

        user.isVerified = true;
        user.verificationToken = null;
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

//USER LOGIN
const loginController = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        const exist = await User.findOne({ where: { email } });
        if (exist) {
            const isValid = await bcrypt.compare(password, exist.password);
            if (!isValid) {
                return res.status(401).json("Credential Invalid");
            }
            if (!exist.isVerified) {
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

            res.cookie("Token", Jwt_token, cookiesOptions);

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
//USER LOGOUTT
const logoutController = (req, res) => {

    res.clearCookie("ver_token");
    return res.status(200).json({
        message: "Logout Successful",
        success: true
    })
};

//USER FORGOT_PASSWORD
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

        const reset_token = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = reset_token;
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
            text: `<p>Click ${process.env.BASE_URL}/resetPassword/${reset_token} here to reset your password. This link is valid for 1 hour.</p>`
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

//USER RESET_PASSWORD
const resetPasswordController = async (req, res) => {
  const { reset_token } = req.params;
  const { new_password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: reset_token,
        resetPasswordExpires: { [Op.gt]: new Date() } // <-- key fix
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
        success: false
      });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.resetPasswordToken = null;               // <-- null instead of undefined
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
      success: true
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
};

//EXPORTING ALL 
export {
    registerController,
    User_verified,
    loginController,
    logoutController,
    forgetPasswordController,
    resetPasswordController
};