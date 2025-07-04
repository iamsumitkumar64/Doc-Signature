import fs from 'fs/promises';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import mongoose from 'mongoose';

import { __dirname } from '../index.js';
import requestDB from '../models/request.js';
import bulkdataDB from '../models/bulkdata.js';
import { delfile } from '../config/deletefiles.js';
import createUploader from '../config/multer.js';

const docxMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const getAllRequests = async (req, res) => {
    try {
        const createdByID = req.session?.userId;

        const matchedDocs = await requestDB.find({
            $or: [
                { createdByID: createdByID },
                { requests: { $elemMatch: { assignedTo: createdByID } } }
            ]
        });

        if (!matchedDocs || matchedDocs.length === 0) {
            return res.status(404).json({ error: 'No Request on Server' });
        }

        const Requests = matchedDocs.flatMap(doc =>
            doc.requests.filter(req =>
                String(doc.createdByID) === String(createdByID) ||
                String(req.assignedTo) === String(createdByID)
            ).map(req => ({
                requestID: req._id,
            }))
        );

        const RequestIDs = Requests.map(r => r.requestID);
        const rejectedData = await bulkdataDB.aggregate([
            {
                $match: {
                    requestID: { $in: RequestIDs }
                }
            },
            {
                $project: {
                    _id: 0,
                    requestID: 1,
                    NoOfRejected: {
                        $size: {
                            $filter: {
                                input: "$data",
                                as: "item",
                                cond: { $eq: ["$$item.status", "Rejected"] }
                            }
                        }
                    },
                    Signeddocuments: {
                        $size: {
                            $filter: {
                                input: "$data",
                                as: "item",
                                cond: { $eq: ["$$item.status", "Signed"] }
                            }
                        }
                    }
                }
            }
        ]);

        for (const item of rejectedData) {
            await requestDB.updateOne(
                { "requests._id": item.requestID },
                {
                    $set: {
                        "requests.$.RejectedDocs": item.NoOfRejected,
                        "requests.$.Signeddocuments": item.Signeddocuments,
                    }
                }
            );
        }

        const requestsArr = matchedDocs.flatMap(doc =>
            doc.requests.filter(req =>
                String(doc.createdByID) === String(createdByID) ||
                String(req.assignedTo) === String(createdByID)
            )
        );

        return res.status(200).json({ requestsArr, role: req.session.role });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

export const signOneRequest = async (req, res) => {
    try {
        const onerequestID = req.body.onerequestID;
        const Signed_img = req.body.selectedSignature;
        await bulkdataDB.findOneAndUpdate(
            { 'data._id': onerequestID },
            {
                $set: {
                    'data.$.signDate': Date.now(),
                    'data.$.status': 'Signed',
                    'data.$.signedBy': req.session.userId,
                    'data.$.Sign_img': Signed_img
                }
            }
        );
        return res.status(200).json({ status: 'Signed Successfully' });
    } catch (error) {
        console.error('Request Signed Error', error);
        return res.status(400).send('Request Signed Error');
    }
}

export const rejectOneRequest = async (req, res) => {
    try {
        const onerequestID = req.body.onerequestID;
        await bulkdataDB.findOneAndUpdate(
            { 'data._id': onerequestID },
            {
                $set: {
                    'data.$.signDate': Date.now(),
                    'data.$.status': 'Rejected',
                    'data.$.signedBy': req.session.userId,
                }
            }
        );
        return res.status(200).json({ status: 'Rejected Successfully' });
    } catch (error) {
        console.error('Request Rejected Error', error);
        return res.status(400).send('Request Rejected Error');
    }
}

export const signAllRequest = async (req, res) => {
    try {
        const reqidtosign = req.body.reqidtosign;
        const reqsignimg = req.body.selectedSignature;
        const signedByObjectId = new mongoose.Types.ObjectId(req.session.userId);

        await requestDB.findOneAndUpdate(
            { 'requests._id': reqidtosign },
            {
                $set: {
                    'requests.$.status': 'Signed',
                    'requests.$.Sign_img': reqsignimg,
                    'requests.$.signedBy': signedByObjectId,
                }
            }
        );
        await bulkdataDB.findOneAndUpdate(
            { requestID: reqidtosign },
            [{
                $set: {
                    data: {
                        $map: {
                            input: "$data",
                            as: "d",
                            in: {
                                $cond: {
                                    if: {
                                        $or: [
                                            { $eq: ["$$d.status", "Signed"] },
                                            { $eq: ["$$d.status", "Rejected"] }
                                        ]
                                    },
                                    then: "$$d",
                                    else: {
                                        $mergeObjects: [
                                            "$$d",
                                            {
                                                status: "Signed",
                                                signDate: new Date(),
                                                signedBy: signedByObjectId,
                                                Sign_img: reqsignimg
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }]
        );

        return res.status(200).json({ status: 'Signed Successfully' });
    } catch (error) {
        console.error('Request Signed Error', error);
        return res.status(400).send('Request Signed Error');
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const reqidtoreject = req.body.reqidtoreject;
        const reject_reason = req.body.rejectReason;
        const signedByObjectId = new mongoose.Types.ObjectId(req.session.userId);

        await requestDB.findOneAndUpdate(
            { 'requests._id': reqidtoreject },
            {
                $set: {
                    'requests.$.status': 'Rejected',
                    'requests.$.Reject_Reason': reject_reason,
                    'requests.$.signedBy': signedByObjectId,
                }
            }
        );

        await bulkdataDB.findOneAndUpdate(
            { requestID: reqidtoreject },
            [{
                $set: {
                    data: {
                        $map: {
                            input: "$data",
                            as: "d",
                            in: {
                                $cond: {
                                    if: {
                                        $or: [
                                            { $eq: ["$$d.status", "Signed"] },
                                            { $eq: ["$$d.status", "Rejected"] }
                                        ]
                                    },
                                    then: "$$d",
                                    else: {
                                        $mergeObjects: [
                                            "$$d",
                                            {
                                                status: "Rejected",
                                                signDate: new Date(),
                                                signedBy: signedByObjectId
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }]
        );

        return res.status(200).json({ status: 'Reject Successfully' });
    } catch (error) {
        console.error('Request Reject Error', error);
        return res.status(400).send('Request Reject Error');
    }
};

export const delegateRequest = async (req, res) => {
    try {
        const reqidtodelegate = req.body.reqidtodelegate;

        await requestDB.findOneAndUpdate(
            { 'requests._id': reqidtodelegate },
            {
                $set: {
                    'requests.$.status': 'Delegated',
                    'requests.$.delegated': true
                }
            }
        );

        await bulkdataDB.findOneAndUpdate(
            { requestID: reqidtodelegate },
            [{
                $set: {
                    data: {
                        $map: {
                            input: "$data",
                            as: "d",
                            in: {
                                $cond: {
                                    if: {
                                        $or: [
                                            { $eq: ["$$d.status", "Signed"] },
                                            { $eq: ["$$d.status", "Rejected"] }
                                        ]
                                    },
                                    then: "$$d",
                                    else: {
                                        $mergeObjects: [
                                            "$$d",
                                            { status: "Delegated" }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }]
        );

        return res.status(200).json({ status: 'Delegate Successfully' });
    } catch (error) {
        console.error('Request Delegate Error', error);
        return res.status(400).send('Request Delegate Error');
    }
};

export const cloneRequest = async (req, res) => {
    try {
        const userId = req.session.userId;
        const reqidtoclone = req.body.reqidtoclone;

        let result = await requestDB.findOne(
            { 'requests._id': reqidtoclone, $or: [{ createdByID: userId }, { 'requests.assignedTo': userId }] },
            { requests: { $elemMatch: { _id: reqidtoclone } } }
        );
        if (!result || !result.requests || result.requests.length === 0) {
            return res.status(404).json({ error: 'Request to clone not found' });
        }

        result = result.requests[0];
        const sourceTemplate = path.join(__dirname, 'uploads', result.template_path);
        const newTemplatePath = Date.now() + result.template_path;
        const destinationTemplate = path.join(__dirname, 'uploads', newTemplatePath);
        await fs.copyFile(sourceTemplate, destinationTemplate);

        // let excelCloneName = null;
        // const bulkData = await bulkdataDB.findOne({ userID: userId, requestID: reqidtoclone });

        // if (bulkData?.excelFile) {
        //     const excelSource = path.join(__dirname, 'uploads', bulkData.excelFile);
        //     excelCloneName = Date.now() + bulkData.excelFile;
        //     const excelDestination = path.join(__dirname, 'uploads', excelCloneName);
        //     await fs.copyFile(excelSource, excelDestination);
        // }
        const role = req.session.role;
        await requestDB.findOneAndUpdate(
            { createdByID: userId, CreatorRole: role },
            {
                $push: {
                    requests: {
                        title: 'Clone' + result.title,
                        description: result.description,
                        template_path: newTemplatePath
                    }
                }
            },
            { upsert: true, new: true }
        );

        // const updatedUser = await requestDB.findOne({ createdByID: userId });
        // const newReq = updatedUser.requests[updatedUser.requests.length - 1];
        // const newReqID = newReq._id;

        // await bulkdataDB.findOneAndUpdate(
        //     { userID: userId, requestID: newReqID },
        //     {
        //         templateFile: newTemplatePath,
        //         ...(excelCloneName && { excelFile: excelCloneName })
        //     },
        //     { upsert: true }
        // );

        return res.status(200).json({ status: 'Cloned Successfully' });
    } catch (error) {
        console.error('Request Cloning Error', error);
        return res.status(400).send('Request Cloning Error');
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const userID = req?.session.userId;
        const reqidtodel = req?.headers?.reqidtodel;

        let ans = await requestDB.findOneAndUpdate(
            { createdByID: userID },
            {
                $pull: {
                    requests: { _id: reqidtodel }
                }
            },
            { returnDocument: 'before' }
        );
        if (ans) {
            const pulledRequest = ans.requests.find(r => r._id.toString() === reqidtodel);
            delfile(pulledRequest.template_path);
        }
        const deleted = await bulkdataDB.findOneAndDelete({ userID, requestID: reqidtodel })
        if (deleted?.excelFile) {
            delfile(deleted.excelFile);
        }
        if (deleted?.OverallPDF) { delfile(deleted.OverallPDF); }
        if (deleted?.templateFile) {
            delfile(deleted.templateFile);
        }
        return res.status(200).json({ status: 'Deleted Successfully' });
    } catch (error) {
        console.error('Request Deletion Error', error);
        return res.status(400).send('Request Deletion Error');
    }
};

export const uploadRequest = (req, res) => {
    createUploader(docxMimeTypes).single('uploadfile')(req, res, async (error) => {
        if (error) {
            return res.status(500).json({ error: "Check the field you're trying to submit" });
        }

        try {
            const { name: title, description } = req.body;
            const createdByID = req.session?.userId;
            const CreatorRole = req.session?.role;
            const uploadFileName = req.file?.filename;

            const content = await fs.readFile(
                path.resolve(__dirname, 'uploads', uploadFileName),
                'binary'
            );

            const zip = new PizZip(content);
            const filefield = zip.file('word/document.xml').asText();

            const requiredFields = ['{Court}', '{%QRCode}', '{%Signature}'];
            const missingFields = requiredFields.filter(field => !filefield.includes(field));

            if (missingFields.length > 0) {
                delfile(uploadFileName);
                return res.status(400).json({ error: 'Docx missing required fields' });
            }

            if (!title || !description || !uploadFileName || !createdByID || CreatorRole === undefined) {
                delfile(uploadFileName);
                return res.status(400).json({ error: 'Missing required fields or session info.' });
            }

            const existingDoc = await requestDB.findOne({
                createdByID,
                'requests.title': title
            });

            if (existingDoc) {
                delfile(uploadFileName);
                return res.status(409).json({ error: 'Request title already exists.' });
            }

            const newRequest = {
                title,
                description,
                template_path: uploadFileName,
                Noofdocuments: 0,
                action: 'Draft',
                RejectedDocs: 0,
                createdAt: new Date()
            };

            await requestDB.updateOne(
                { createdByID },
                {
                    $setOnInsert: { CreatorRole },
                    $push: { requests: newRequest }
                },
                { upsert: true }
            );

            const allRequests = await requestDB.findOne({ createdByID });
            const addedRequest = allRequests.requests.find(req => req.title === title);
            const requestID = addedRequest?._id;

            await bulkdataDB.findOneAndUpdate(
                { userID: createdByID, requestID },
                { templateFile: uploadFileName },
                { upsert: true }
            );

            return res.status(200).json({ success: 'Request added successfully.' });
        } catch (err) {
            delfile(req.file?.filename);
            console.error('Upload error:', err);
            return res.status(400).json({ error: 'File type not allowed or internal error' });
        }
    });
};