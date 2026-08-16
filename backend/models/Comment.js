import mongoose from 'mongoose';
const CommentSchema = new mongoose.Schema({
    studentID : { type: mongoose.Schema.Types.ObjectId, ref: 'Student'},
    staffID : { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

    content : { type: String, required: true },
},{
  timestamps:true
  });
export const Comment = mongoose.model('Comment', CommentSchema);