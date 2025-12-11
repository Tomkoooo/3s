import { Schema, models, model, Document, Model } from "mongoose";

export interface IUpload {
    length: number;
    chunkSize: number;
    uploadDate: Date;
    filename: string;
    md5: string;
}

export const uploadSchema = new Schema<IUpload>({
    length: { type: Number },
    chunkSize: { type: Number },
    uploadDate: { type: Date },
    filename: { type: String, trim: true },
    md5: { type: String, trim: true },
}, {
    collection: 'uploads.files', // GridFS collection név
});

export type UploadDocument = IUpload & Document;

// Model név 'Upload', de collection 'uploads.files' (GridFS standard)
const UploadModel = (models.Upload as Model<IUpload>) || model<IUpload>('Upload', uploadSchema);

export default UploadModel;