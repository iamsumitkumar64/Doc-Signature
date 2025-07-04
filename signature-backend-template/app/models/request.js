import mongoose from "mongoose";

const requestSubSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    }, 
    signedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    Sign_img: {
        type: String
    },
    delegated: {
        type: Boolean,
        default: false
    },
    Reject_Reason: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: null
    },
    Noofdocuments: {
        type: Number,
        default: 0,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Signed', 'Submitted', 'Delegated', 'Rejected'],
        default: 'Draft'
    },
    RejectedDocs: {
        type: Number,
        default: 0,
        required: true
    },
    Signeddocuments: {
        type: Number,
        default: 0,
        required: true
    },
    template_path: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const schema = new mongoose.Schema({
    createdByID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    CreatorRole: {
        type: Number,
        required: true
    },
    requests: [requestSubSchema]
}, { timestamps: true });

const model = mongoose.model("requests", schema);
export default model;