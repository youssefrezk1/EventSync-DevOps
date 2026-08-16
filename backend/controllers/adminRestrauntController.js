import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { Restraunt } from '../models/Restraunt.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// GetRestraunts - admin only
export async function GetRestraunts(req, res) {
  try {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const restaurants = await Restraunt.find().skip(skip).limit(Number(limit)).select('-passwordHash');
    const total = await Restraunt.countDocuments();
    return res.status(200).json({ restaurants, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('GetRestraunts error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// CreateRestraunt - admin only
export async function CreateRestraunt(req, res) {
  try {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const schema = Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existing = await Restraunt.findOne({ $or: [{ id: value.id }, { email: value.email }] });
    if (existing) return res.status(409).json({ message: 'Restaurant with same id or email already exists' });

    const passwordHash = await bcrypt.hash(value.password, 10);

    let logoUrl = '';
    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurants/logos',
        });
        logoUrl = uploadResult.secure_url;
        // Cleanup temp file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Clean up even if upload fails
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const r = new Restraunt({
      id: value.id,
      name: value.name,
      email: value.email,
      passwordHash,
      logo: logoUrl ? [{ url: logoUrl }] : []
    });
    await r.save();
    return res.status(201).json({ message: 'Restaurant created', restaurant: { id: r._id, name: r.name, email: r.email } });
  } catch (err) {
    console.error('CreateRestraunt error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DeleteRestraunt - admin only
export async function DeleteRestraunt(req, res) {
  try {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Restaurant id required' });

    const deleted = await Restraunt.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Restaurant not found' });
    return res.status(200).json({ message: 'Restaurant deleted' });
  } catch (err) {
    console.error('DeleteRestraunt error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
