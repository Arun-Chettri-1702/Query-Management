import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});
console.log(process.env.DATABASE_URL, "yfyufy");

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.DATABASE_URL}`
        );
        console.log(
            "\nMongoDB connected ! DB host ",
            connectionInstance.connection.host
        );
    } catch (error) {
        console.log("mongoDB connection error ", error);
        process.exit(1);
    }
};

export default connectDB;
