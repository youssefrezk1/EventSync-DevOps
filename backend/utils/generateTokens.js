import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Student } from '../models/Student.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const student = await Student.findOne({ studentId: "64-7433" }); // pick your test student
  const token = jwt.sign({ id: student._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "9h" });
  console.log("JWT Token:", token);
  process.exit();
});