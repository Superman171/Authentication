import { DataTypes, Sequelize } from "sequelize";  
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../Database/db.connection.js";
//CREATING SCHEMA FOR DB

const createUserModel=(sequelize)=>{
    const User = sequelize.define("User",{
        id:{
            type: DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        username:{
            type: DataTypes.STRING,
            allowNull:false,
            unique:true
        },
        email:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true,
            validate:{isEmail:true}
        },
        password:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
        },
        verificationToken:{

            type:DataTypes.STRING,
            allowNull:true
        },
        isVerified:{
            type:DataTypes.BOOLEAN,
            defaultValue: false
        },
        resetPasswordToken:{
            type:DataTypes.STRING,
            allowNull:true
        },
        resetPasswordExpires:{
            type:DataTypes.DATE,
            allowNull:true
        }
    },
        {
            timesstamps:true
        });
    return User;


//Anytime if password changes it will automatic encrypt with bcrypt
User.addHook('afterSave', async function(next){
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10)
        next()
    }
})



User.prototype.checkPassword(async function (password){
    return await bcrypt.compare(password, this.password);
})

}
//EXPORTING MODEL
export default createUserModel;