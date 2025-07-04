import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { __dirname } from '../index.js';
import { PDFDocument } from 'pdf-lib'
import { exec } from 'child_process';
import { promisify } from 'util';
import QRCode from 'qrcode';
import { delfile } from './deletefiles.js';

async function generateQRCodeImage(data, filename) {
    const qrPath = path.resolve(__dirname, 'uploads', filename);
    const qrBuffer = await QRCode.toBuffer(data);
    await fs.writeFile(qrPath, qrBuffer);
    return filename;
}

const imageOptions = {
    getImage(tagValue, tagName, meta) {
        try {
            if (typeof (tagValue) !== 'string' || tagValue.trim() === '') {
                return Buffer.from(
                    '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
                    '1f15c4890000000a49444154789c63600000020001005fe2' +
                    '27d20000000049454e44ae426082', 'hex'
                );
            }
            const fullPath = path.resolve(__dirname, 'uploads', tagValue);
            const imageBuffer = fsSync.readFileSync(fullPath);
            if (tagName === 'QRCode') {
                try {
                    delfile(fullPath);
                } catch (err) {
                    console.log(`Error in QRcode Deletion: ${err}`);
                }
            }
            return imageBuffer;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`Image file not found: ${tagValue}`);
                return Buffer.from(
                    '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
                    '1f15c4890000000a49444154789c63600000020001005fe2' +
                    '27d20000000049454e44ae426082', 'hex'
                );
            } else {
                console.error(`Unexpected error reading image: ${tagValue}`, error);
                throw error;
            }
        }
    },
    getSize(img) {
        return [150, 150];
    },
};

async function generateDocx(templateFileName, court, headers, data = {}) {
    if (!data) return;
    let dataPortion = {};
    for (let key in headers['0']) {
        dataPortion[headers['0'][key]] = data[key];
    }
    if (data.status === 'Signed') {
        dataPortion['Signature'] = data.Sign_img ?? 'Not Signed Yet';
        dataPortion['QRCode'] = data.qrcode ?? 'Not SIgned Yet';
    }
    dataPortion['Court'] = court ?? '';

    const timestamp = Date.now();
    const newDocxFileName = `DocFile${timestamp}${templateFileName}.docx`;
    const newPdfFileName = `DocFile${timestamp}${templateFileName}.pdf`;
    const docxFilePath = path.resolve(__dirname, 'uploads', newDocxFileName);

    try {
        const docxContent = await fs.readFile(path.resolve(__dirname, 'uploads', templateFileName));
        const zip = new PizZip(docxContent);

        const docxtemplate = new Docxtemplater(zip, {
            modules: [new ImageModule(imageOptions)],
        });

        try {
            docxtemplate.render(dataPortion);

            const docxBuffer = docxtemplate.getZip().generate({
                type: 'nodebuffer',
                compression: "DEFLATE"
            });

            if (docxBuffer.length === 0) {
                throw new Error('Rendered document is empty');
            }

            await fs.writeFile(docxFilePath, docxBuffer);

            const pdfFilePath = await convertDocxToPdf(newDocxFileName);

            try {
                await fs.unlink(docxFilePath);
                console.log(`Deleted file: ${newDocxFileName}`);
            } catch (accessErr) {
                if (accessErr.code !== 'ENOENT') {
                    console.error("Unexpected error while deleting file:", accessErr);
                }
            }
            return newPdfFileName;

        } catch (e) {
            console.log(`Deleted file: ${newDocxFileName}`);
            console.log("Generate Docx Handler Error: ", e);
            throw e;
        }

    } catch (error) {
        console.error('Error in generateDocx:', error);
        throw error;
    }
}

async function convertDocxToPdf(newDocxFileName) {
    try {
        const execAsync = promisify(exec);
        const inputPath = path.resolve(__dirname, 'uploads', newDocxFileName);
        const outputDir = path.resolve(__dirname, 'uploads');
        const pdfFileName = path.basename(newDocxFileName, '.docx') + '.pdf';

        const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
            console.warn('LibreOffice warning or error:', stderr);
        }

        const pdfFilePath = path.join(outputDir, pdfFileName);
        return pdfFilePath;
    } catch (error) {
        console.error('Error converting DOCX to PDF:', error);
        throw error;
    }
}

export async function generateFinalPdf(wholePdf, requestid, court, template, headers, dataList) {
    try {
        let qrCodeName = '';
        if (wholePdf) {
            const pdfPaths = [];
            for (const data of dataList) {
                if (data.status == 'Signed') {
                    qrCodeName = `QrCode${data.signDate + Date.now()}.png`;
                    const qrCodeFileName = await generateQRCodeImage(JSON.stringify(data), qrCodeName);
                    data.qrcode = qrCodeFileName;
                }
                const filePath = await generateDocx(template, court, headers, data);
                if (filePath) {
                    pdfPaths.push(filePath);
                }
            }

            if (pdfPaths.length === 0) {
                throw new Error('No PDFs generated');
            }

            const mergedPdf = await PDFDocument.create();

            for (const filePath of pdfPaths) {
                const pdfBytes = await fs.readFile(path.resolve(__dirname, 'uploads', filePath));
                const pdf = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }

            const timestamp = Date.now();
            const finalPdfFileName = `OverallPDF_${timestamp}.pdf`;
            const finalPdfPath = path.resolve(__dirname, 'uploads', finalPdfFileName);

            const finalPdfBytes = await mergedPdf.save();
            await fs.writeFile(finalPdfPath, finalPdfBytes);

            for (const filePath of pdfPaths) {
                try {
                    await fs.unlink(path.resolve(__dirname, 'uploads', filePath));
                } catch (err) {
                    console.warn(`Failed to delete temp PDF: ${filePath}`, err);
                }
            }

            return finalPdfFileName;
        } else {
            const data = dataList.find(eachData => eachData._id.toString() === requestid);
            if (data.status == 'Signed') {
                qrCodeName = `QrCode${data.signDate + Date.now()}.png`;
                const qrCodeFileName = await generateQRCodeImage(JSON.stringify(data), qrCodeName);
                data.qrcode = qrCodeFileName;
            }
            const filePath = await generateDocx(template, court, headers, data);
            console.log(filePath);
            return filePath;
        }
    } catch (error) {
        console.error('Error in generateFinalPdf:', error);
        throw error;
    }
}