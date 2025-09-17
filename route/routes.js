import { Router } from "express";
import { loginController, registerController } from "../controller/userController.js";

const router =  Router();

// router.get("/",(req,res)=>{
//     return res.json("hello");
// });     

//API for registeration
router.post("/register", registerController);

//API for login
router.post("/login", loginController);

export default router;