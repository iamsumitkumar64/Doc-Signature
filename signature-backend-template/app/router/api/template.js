import { Router } from 'express';
import bulkdataDB from '../../models/bulkdata.js';
import { generateFinalPdf } from '../../config/pdfGenerator.js';
const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const reqID = req.headers.reqid;
        const court = req.session.courtId;
        let ans = await bulkdataDB.findOne(
            { $or: [{ requestID: reqID }, { 'data._id': reqID }] }
        );
        if (!ans || !ans.data.length) {
            return res.status(400).json({ status: 'Upload Data First' });
        }
        let wholepdf = false;
        if (reqID == (ans.requestID).toString()) { wholepdf = true; }
        const pdfPath = await generateFinalPdf(wholepdf, reqID, court, ans.templateFile, ans.headers, ans.data);
        if (pdfPath) {
            if (reqID == (ans.requestID).toString()) {
                await bulkdataDB.findOneAndUpdate(
                    { requestID: reqID },
                    { OverallPDF: pdfPath }
                );
            } else {
                await bulkdataDB.findOneAndUpdate(
                    { 'data._id': reqID },
                    { $set: { 'data.$.eachPDF': pdfPath } }
                );
            }
        }
        else {
            return res.status(404).json({ 'status': 'Preview not Created' });
        }
        return res.status(200).json({ status: 'sent Successfully', pdfpath: pdfPath });
    } catch (error) {
        next(error);
    }
});

export default router;