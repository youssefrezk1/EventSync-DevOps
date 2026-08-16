import { Router } from 'express';
import { Bazaar } from '../models/Bazaar.js';

import {
  createBazaar,
  getBazaars,
  getBazaarById,
  updateBazaar,
  deleteBazaar
} from '../controllers/eventBazaarcontrollers.js';

const router = Router();

router.get('/', getBazaars);
router.get('/:id', getBazaarById);
router.post('/', createBazaar);
router.patch('/:id', updateBazaar);
router.delete('/:id',deleteBazaar);
// use PATCH for partial update
/*router.get('/', async (req, res, next) => {
  try {
    const bazaars = await Bazaar.find();
    res.json({ bazaars });
  } catch (err) {
    next(err);
  }
});
*/
export default router;
