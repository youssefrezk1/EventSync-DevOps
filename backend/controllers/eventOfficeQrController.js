import {Bazaar} from '../models/Bazaar.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { sendExternalQrCodeBazaar, sendExternalQrCodeBooth } from '../utils/emailService.js';


export async function generateAndSendExternalQrCode(req, res) {
  try {
    const { email, firstname } = req.body;
    const { bazaarId } = req.params;
    if (!email || !bazaarId || !firstname) {
      return res.status(400).json({ message: 'Email, Bazaar ID, and First Name are required.' });
    }
    // Fetch bazaar details from the database
    console.log('bazaarId:', bazaarId);
    const bazaarDetails = await Bazaar.findById(bazaarId);
    console.log('bazaarDetails:', bazaarDetails);
    if (!bazaarDetails) {
      return res.status(404).json({ message: 'Bazaar not found.' });
    }
    // Send the external QR code via email
    await sendExternalQrCodeBazaar(email, bazaarDetails, firstname);
    res.status(200).json({ message: 'External QR code sent successfully.' });
  } catch (error) {
    console.error('Error generating and sending external QR code:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
export async function generateAndSendExternalQrCode2(req, res) {
  try {
    const { email, firstname } = req.body;
    const { boothId } = req.params;
    if (!email || !boothId || !firstname) {
      return res.status(400).json({ message: 'Email, Booth ID, and First Name are required.' });
    }
    // Fetch booth details from the database
    console.log('boothId:', boothId);
    const boothDetails = await RegisterBooth.findById(boothId)
     .populate({
        path: 'VendorID',
        select: 'companyName logo', // only get these fields from Vendor
      })
      .lean();
    console.log('boothDetails:', boothDetails);
    if (!boothDetails) {
      return res.status(404).json({ message: 'Booth not found.' });
    }
    const companyName = boothDetails.VendorID.companyName;
    // Send the external QR code via email
    await sendExternalQrCodeBooth(email, boothDetails, companyName, firstname);
    res.status(200).json({ message: 'External QR code for Booth sent successfully.' });
  } catch (error) {
    console.error('Error generating and sending external QR code for Booth:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
