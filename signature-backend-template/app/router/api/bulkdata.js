import { Router } from 'express';
import {
    getBulkData,
    deleteChunk,
    uploadBulkData
} from '../../controller/bulkdataController.js';

const router = Router();

router.get('/', getBulkData);
// router.delete('/', deleteChunk);
router.post('/', uploadBulkData);

export default router;