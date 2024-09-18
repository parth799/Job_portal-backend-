import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./env"
})
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("Error" , error);
        throw error
    })
    app.listen(process.env.PORT || 2000, () =>{
        console.log(`server is runnig at http://localhost:${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Mongo databse connectin failled !!! ", err );
})
