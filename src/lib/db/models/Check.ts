import { Schema, models, model, Document, ObjectId } from "mongoose";

export type ICheck = {
    text: string;
    description?: string;
    referenceImage?: ObjectId;
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
})

export type CheckDocument = ICheck & Document;

// Ensure model is properly registered
const CheckModel = models.Check || model<ICheck>('Check', checkSchema);

export default CheckModel;