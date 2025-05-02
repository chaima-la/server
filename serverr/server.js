const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db.js");
const cors = require("cors");
const authRoutes = require("./routes/authRoute.js"); 
 
//configure env
dotenv.config();

//databse config
connectDB();

//rest object
const app = express();

//middelwares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);

//rest api
  
  //PORT
  const PORT = process.env.PORT || 8080;
  
  //run listen
  app.listen(PORT, () => {
    console.log(
      `Server Running on  ${PORT}`
    );
  });