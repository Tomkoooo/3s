import { Schema, models, model, Document, ObjectId } from "mongoose";

export type CheckAnswerType = 'ok_nok' | 'info_text';

export type ICheck = {
    text: string;
    description?: string;
    referenceImage?: ObjectId; // Deprecated
    referenceImages?: ObjectId[];
    answerType?: CheckAnswerType;
    scoring?: boolean;
}

export const checkSchema = new Schema<ICheck>({
    text: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    referenceImage: {
        type: Schema.Types.ObjectId,
        ref: "Upload", // Model név string-ként
        required: false,
    },
    referenceImages: {
        type: [Schema.Types.ObjectId],
        ref: "Upload",
        required: false,
    },
    answerType: {
        type: String,
        required: false,
        default: 'ok_nok',
    },
    scoring: {
        type: Boolean,
        required: false,
        default: true,
    },
})

export type CheckDocument = ICheck & Document;

// Ensure model is properly registered
const CheckModel = models.Check || model<ICheck>('Check', checkSchema);

export default CheckModel;