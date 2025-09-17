import express from "express";
import { dbConnection } from "./db/dbConnection.js";
import { registerController, loginController } from "./controller/userController.js";
import router from "./route/routes.js";
const app = express();
import dotenv from "dotenv";
dotenv.config();

dbConnection("auth","postgres","shambhu")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));   
app.use("/api",router);

app.listen(process.env.PORT,()=>{
    console.log(`server running at port 8080`);
});