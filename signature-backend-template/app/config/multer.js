import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage(
    {
        destination: function (request, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (request, file, cb) {
            const date = new Date().toISOString()
                .replace(/T/, '_')
                .replace(/:/g, '-')
                .replace(/\..+/, '');
            request.fileName = `${date}-${file.originalname}`;
            cb(null, request.fileName);
        }
    }
);

function createUploader(allowedTypes) {
    const filter = (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    };
    return multer(
        {
            storage,
            fileFilter: filter,
            limits: 2 * 1024 * 1024,
        }
    );
}

export default createUploader;