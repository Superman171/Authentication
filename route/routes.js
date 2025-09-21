import { Router } from "express";
import { registerController, User_verified, loginController, logoutController, forgetPasswordController, resetPasswordController } from "../controller/userController.js";
import { authMiddleware } from "../middleware/Auth_middleware.js";

const router =  Router();

//All Router with controller

//API for registeration
router.post("/register", registerController);
//Verification
router.get("/verify/:ver_token", User_verified);
//API for login
router.post("/login", loginController);
//logout
router.get("/logout",authMiddleware,logoutController);
//API fro forgot password
router.post("/forgotPassword",forgetPasswordController);
//Reset
router.post("/resetPassword/:reset_token",resetPasswordController);

export default router;