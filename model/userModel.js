import { DataTypes } from "sequelize";  


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
}


export default createUserModel;