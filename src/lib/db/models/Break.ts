import { Schema, models, model, Document, ObjectId, Model } from "mongoose";

export type IBreak = {
    userId: ObjectId;
    start: string;
    end: string;
    reason?: string;
}

const breakSchema = new Schema<IBreak>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    start: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    end: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    reason: {
        type: String,
        required: false,
    },
})

// Indexek a gyors queryért
breakSchema.index({ userId: 1, start: 1 });
breakSchema.index({ start: 1 });
breakSchema.index({ end: 1 });

export type BreakDocument = IBreak & Document;

const BreakModel = (models.Break as Model<IBreak>) || model<IBreak>('Break', breakSchema);

export default BreakModel;