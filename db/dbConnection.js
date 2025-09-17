import { Sequelize } from 'sequelize';
import createUserModel from '../model/userModel.js';

let User=null;
export const dbConnection = async (database, username, password) => {

    const sequelize = new Sequelize('auth', 'postgres', 'shambhu', {
        host: 'localhost',
        dialect: 'postgres'
    });

    try {
        await sequelize.authenticate();
        User = await createUserModel(sequelize);
        await sequelize.sync({alter: true});
        console.log('Connection to DB has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

export {User};