import { request, Router } from 'express';
import userDB from '../../models/users.js';
import requestDB from '../../models/request.js';
const router = Router();

router.post('/', async (req, res) => {
    try {
        const courtId = req.session.courtId;
        const reqid = req.body.reqid;
        let result = await requestDB.findOne(
            { 'requests._id': reqid },
            { requests: { $elemMatch: { _id: reqid } } }
        );
        if (!result || !result.requests || result.requests.length === 0) {
            return res.status(404).json({ status: 'Request not found' });
        }
        if (result.requests[0].Noofdocuments <= 0) {
            return res.status(400).json({ status: 'Please upload Data first' });
        }
        let employee = await userDB.find({ courtId, role: 2 }, { name: 1, email: 1, id: 1, _id: 0 });
        return res.send(employee);
    } catch (e) {
        return res.status(400).json({ status: "Error occurred" });
    }
});

export default router;