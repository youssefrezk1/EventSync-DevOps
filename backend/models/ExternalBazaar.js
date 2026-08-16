import mongoose from "mongoose";    

const   externalBaazar = new mongoose.Schema(
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
     type: mongoose.Schema.Types.ObjectId, ref: 'Bazaar', required: true ,
  }
},{
    timestamps: true
  });


export const ExternalBazaar=mongoose.model('ExternalBooth',externalBaazar);

  