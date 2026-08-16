import express from "express";
import { Router } from 'express';
import { getBazaarDetails,deleteBazaar } from '../controllers/bazaarController.js';

const router = Router();


router.get('/:id', getBazaarDetails);
router.delete('/:id', deleteBazaar);
export default router;
