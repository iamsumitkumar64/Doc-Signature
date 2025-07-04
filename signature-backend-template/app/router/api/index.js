import { Router } from 'express';
import courtApi from './court.js';
import userApi from './user.js';
import signatureApi from './signautre.js';
import templateApi from './template.js';
import requests from './requests.js';
import bulkdataApi from './bulkdata.js';
import allemployeeApi from './allemployee.js';

let router = Router();
router.use('/courts', courtApi);
router.use('/users', userApi);
router.use('/signatures', signatureApi);
router.use('/template', templateApi);
router.use('/requests', requests);
router.use('/bulkdataApi', bulkdataApi);
router.use('/allemployee', allemployeeApi);
export default router;