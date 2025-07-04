import { Router } from 'express';
import {
    getUserSignatures,
    uploadSignature,
    assignedTo,
} from '../../controller/signatureController.js';

const router = Router();

router.get('/', getUserSignatures);
router.post('/', uploadSignature);
router.post('/assignedTo', assignedTo);

export default router;