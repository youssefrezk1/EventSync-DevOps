import mongoose from "mongoose";    

const   externalBooth = new mongoose.Schema(
{
 name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    
  },
  booth:{
     type: mongoose.Schema.Types.ObjectId, ref: 'RegisterBooth', required: true ,
  }
},{
    timestamps: true
  });


export const ExternalBooth=mongoose.model('ExternalBooth',externalBooth);

  