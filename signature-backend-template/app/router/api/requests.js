import { Router } from 'express';
import {
    getAllRequests,
    cloneRequest,
    deleteRequest,
    uploadRequest,
    delegateRequest,
    rejectRequest,
    signAllRequest,
    signOneRequest,
    rejectOneRequest
} from '../../controller/requestController.js';

const router = Router();

router.get('/', getAllRequests);
router.delete('/', deleteRequest);
router.post('/', uploadRequest);
router.post('/clone', cloneRequest);
router.post('/delegate', delegateRequest);
router.post('/reject', rejectRequest);
router.post('/signAll', signAllRequest);
router.post('/signone', signOneRequest);
router.post('/rejectone', rejectOneRequest);

export default router;