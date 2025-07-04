import signDB from '../models/signatures.js';
import requestDB from '../models/request.js';
import bulkdataDB from '../models/bulkdata.js';
import { delfile } from '../config/deletefiles.js';
import createUploader from '../config/multer.js';

const imageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml'
];

export const getUserSignatures = async (req, res, next) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not logged in'
            });
        }
        const userSignatures = await signDB.findOne({ userId });
        if (!userSignatures || !userSignatures.url?.length) {
            return res.status(400).json({
                success: false,
                message: 'No images found'
            });
        }
        res.status(200).json({
            success: true,
            images: userSignatures.url
        });
    } catch (error) {
        next(error);
    }
};

export const uploadSignature = [
    createUploader(imageMimeTypes).single('uploadfile'),

    async (req, res, next) => {
        try {
            const userId = req.session?.userId;
            const uploadFileName = req.file?.filename;

            if (!userId) {
                delfile(req.file?.filename);
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not logged in'
                });
            }

            if (!uploadFileName) {
                delfile(req.file?.filename);
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            await signDB.findOneAndUpdate(
                { userId },
                { $push: { url: uploadFileName } },
                { upsert: true, new: true }
            );

            res.status(200).json({
                success: true,
                message: 'success'
            });
        } catch (error) {
            delfile(req.file?.filename);
            next(error);
        }
    }
];

export const assignedTo = async (req, res, next) => {
    try {
        const result = await requestDB.findOneAndUpdate(
            { 'requests._id': req.body.requestID },
            { $set: { 'requests.$.assignedTo': req.body.officerID, 'requests.$.status': 'Pending' } }
        );
        await bulkdataDB.findOneAndUpdate(
            { requestID: req.body.requestID },
            {
                $set: {
                    'data.$[].status': 'Pending',
                }
            }
        );
        if (!result) {
            return res.status(404).send('Request not found');
        }
        return res.send('Assigned successfully');
    } catch (err) {
        next(err);
    }
}