import mongoose from 'mongoose';

const dynamicDataItemSchema = new mongoose.Schema(
    {
        signDate: { type: String, required: true, default: "" },
        signedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        status: {
            type: String,
            // enum: ['Draft', 'Pending', 'Signed', 'Submitted', 'Delegated', 'Rejected', 'Failed'],
            enum: ['Draft', 'Signed', 'Pending', 'Rejected', 'Delegated'],
            default: 'Draft'
        },
        eachPDF: {
            type: String
        },
        Sign_img: {
            type: String
        },
    },
    {
        strict: false // <- allows extra dynamic fields
    }
);

const schema = new mongoose.Schema(
    {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        requestID: {
            type: mongoose.Schema.ObjectId,
            ref: 'request',
            required: true,
            unique: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            default: null
        },
        data: {
            type: [dynamicDataItemSchema],
            default: []
        },
        headers: {
            type: dynamicDataItemSchema,
            default: {}
        },
        templateFile: {
            type: String,
            required: true
        },
        excelFile: {
            type: String,
            required: true,
            default: ""
        },
        OverallPDF: {
            type: String
        },
        Sign_img: {
            type: String
        },
    },
    {
        timestamps: true,
    }
);

const model = mongoose.model('Bulk-Data', schema);
export default model;