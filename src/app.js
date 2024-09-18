import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'
import morgan from 'morgan';
import { config } from "dotenv";

const app = express()
// config({ path: "./config/config.env" });

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(express.static("public"))

app.use(morgan("dev"));


export default app;