//MAIN FILE
import express from "express";
import { dbConnection } from "./Database/dbConnection.js";
import router from "./route/routes.js";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();

//Connecting Db
dbConnection("auth","postgres","NimbusOne");

app.use(cors({
  origin: "http://localhost:8080", // frontend URL (not "*")
  credentials: true,               // must be lowercase
  exposedHeaders: ["Authorization"], // lowercase
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));   
app.use("/api",router);

//Hosting Port
app.listen(process.env.PORT,()=>{
    console.log(`server running at port 8080`);
});