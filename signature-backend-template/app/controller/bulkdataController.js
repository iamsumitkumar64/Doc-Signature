import path from 'path';
import excelToJson from 'convert-excel-to-json';
import bulkdataDB from '../models/bulkdata.js';
import requestDB from '../models/request.js';
import { delfile } from '../config/deletefiles.js';
import { __dirname } from '../index.js';

export const getBulkData = async (req, res) => {
    try {
        const userID = req.session?.userId;
        const reqID = req.headers?.requestid;
        if (!userID) {
            return res.status(400).json({ status: "Please Login First" });
        }
        const allData = await bulkdataDB.findOne({
            // userID: userID,
            requestID: reqID
        });
        return res.status(200).json({ status: "Successfully Loaded", data: allData });
    } catch (e) {
        return res.status(400).json({ status: "Error occurred" });
    }
};

export const deleteChunk = async (req, res) => {
    try {
        // const userID = req?.session.userId;
        const idtodel = req?.headers?.idtodel;

        let result = await bulkdataDB.findOneAndUpdate(
            // { userID: userID, 'data._id': idtodel },
            {'data._id': idtodel },
            {
                $pull: {
                    data: { _id: idtodel }
                }
            },
            { new: true }
        );

        await requestDB.findOneAndUpdate(
            { 'requests._id': result?.requestID },
            { 'requests.$.Noofdocuments': result?.data?.length }
        );

        return res.status(200).json({ status: 'Deleted Successfully' });
    } catch (error) {
        console.error("Bulk-Data Chunk Deletion Error:", error);
        return res.status(400).send("Bulk-Data Chunk Deletion Error");
    }
};

const XlsxMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const uploadBulkData = async (req, res) => {
    const createUploader = (await import('../config/multer.js')).default;
    createUploader(XlsxMimeTypes).single('uploadfile')(req, res, async (error) => {
        if (error) {
            return res.status(500).json({ error: "Check the field you're trying to submit" });
        }
        try {
            const userID = req.session?.userId;
            const requestID = req.headers.requestid;
            const uploadFileName = req.file?.filename;

            let isReq = await requestDB.findOne({ 'requests._id': requestID });
            if (!isReq) return res.status(400).send('Request is not valid');

            const excelFile = excelToJson({
                sourceFile: path.resolve(__dirname, 'uploads', uploadFileName)
            });

            let excelData = [];
            let excelHeaders = {};

            for (let sheet in excelFile) {
                if (Object.keys(excelHeaders).length < Object.keys(excelFile[sheet][0] || {}).length) {
                    excelHeaders = excelFile[sheet].slice(0, 1);
                }
            }

            for (let sheet in excelFile) {
                excelData.push(...excelFile[sheet].slice(1));
            }

            let oldone = await bulkdataDB.findOneAndUpdate(
                { requestID, userID },
                { excelFile: uploadFileName, headers: excelHeaders, data: excelData },
                { upsert: true }
            );

            await requestDB.findOneAndUpdate(
                { 'requests._id': requestID },
                { 'requests.$.Noofdocuments': excelData.length }
            );

            if (oldone?.excelFile) {
                delfile(oldone.excelFile);
            }

            return res.status(200).json({ success: 'Request added successfully.' });
        } catch (error) {
            delfile(req.file?.filename);
            console.error("Upload error:", error);
            return res.status(400).json({ error: 'File type not allowed' });
        }
    });
};