import { Router } from "express";
import { registerController, User_verified, loginController, logoutController, forgetPasswordController, resetPasswordController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router =  Router();

//All Router with controller

//API for registeration
router.route("/register").post(registerController);

//Verification
router.route("/verify/:ver_token").get(User_verified);

//API for login
router.route("/login").post(loginController);

//logout
router.route("/logout").get(authMiddleware,logoutController);

//API fro forgot password
router.route("/forgotPassword").post(forgetPasswordController);

//Reset
router.route("/resetPassword/:reset_token").post(resetPasswordController);

export default router;