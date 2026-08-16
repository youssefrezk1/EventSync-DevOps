import Joi from 'joi';
import {Wir} from '../models/Wir.js';
import { notifyNewPartner } from '../controllers/notificationController.js';

const WirSchema = Joi.object({
  discountRate: Joi.number().min(0).max(100).required(),
  promoCode: Joi.string().required(),
  termsAndConditions: Joi.string().required()
});

export async function createWir(req, res, next) {
  try {
    const vendorID = req.id; // retrieved from requireAuth middleware
    const { discountRate, promoCode, termsAndConditions } = req.body;

    // ✅ Validate request body
    const { error } = WirSchema.validate({
      discountRate,
      promoCode,
      termsAndConditions,
    });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // ✅ Check if vendor already has a Wir application
    const existingWir = await Wir.findOne({ vendorID });
    if (existingWir) {
      return res.status(400).json({
        message: 'You have already submitted an application to the GUC Loyalty Program.',
      });
    }

    // ✅ Create new application record
    const wir = new Wir({
      vendorID,
      discountRate,
      promoCode,
      termsAndConditions,
    });

    await wir.save();

    // 🔔 SEND NOTIFICATION TO ALL USERS (Student, Staff, TA, Professor)
    try {
      console.log('📧 Sending new loyalty partner notification to all users...');
      await notifyNewPartner(wir);
      console.log('✅ New loyalty partner notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send loyalty partner notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: 'Application submitted successfully to GUC Loyalty Program.',
      wir,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteWir(req, res, next) {
  try {
    const vendorID = req.id; // from requireAuth middleware
    const wirId = req.params.id;

    // Check if this application exists and belongs to the same vendor
    const wir = await Wir.findById(wirId);

    if (!wir) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (wir.vendorID.toString() !== vendorID.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }

    await Wir.findByIdAndDelete(wirId);

    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getAllPartners(req, res, next) {
  try {
    // ✅ Populate vendor info (companyName + logo)
    const partners = await Wir.find()
      .populate({
        path: 'vendorID',
        select: 'companyName logo', // only get these fields from Vendor
      })
      .lean();

    // ✅ Transform response to only include needed info
    const formattedPartners = partners.map((p) => ({
      wirId: p._id,
      companyName: p.vendorID?.companyName || 'Unknown',
      logo: p.vendorID?.logo?.[0]?.url || null,
      discountRate: p.discountRate,
      promoCode: p.promoCode,
      termsAndConditions: p.termsAndConditions,
    }));

    res.status(200).json({
      count: formattedPartners.length,
      partners: formattedPartners,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyWir(req, res, next) {
  try {
    const vendorID = req.id; // from requireAuth middleware
    const wir = await Wir.findOne({ vendorID });
    
    if (!wir) {
      return res.status(404).json({ hasApplication: false });
    }
    
    res.status(200).json({ hasApplication: true, wir });
  } catch (err) {
    next(err);
  }
}