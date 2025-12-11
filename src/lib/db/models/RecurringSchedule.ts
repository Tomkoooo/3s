import { Schema, models, model, type Document, type Model } from "mongoose";
import { ObjectId } from "mongodb";

export interface IRecurringSchedule {
    name: string;
    siteIds: ObjectId[];
    frequency: 'daily' | 'weekly' | 'monthly';
    auditorPool: ObjectId[];
    auditorsPerAudit: number;
    maxAuditsPerDay?: number;
    createdBy: ObjectId;
    createdAt: Date;
    isActive: boolean;
    lastGeneratedDate?: Date; // The last date for which we generated audits
}

const recurringScheduleSchema = new Schema<IRecurringSchedule>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    siteIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: true,
    }],
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true,
    },
    auditorPool: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    auditorsPerAudit: {
        type: Number,
        default: 1,
        min: 1,
    },
    maxAuditsPerDay: {
        type: Number,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastGeneratedDate: {
        type: Date,
    },
});

export type RecurringScheduleDocument = IRecurringSchedule & Document;

const RecurringScheduleModel = (models.RecurringSchedule as Model<IRecurringSchedule>) || model<IRecurringSchedule>('RecurringSchedule', recurringScheduleSchema);

export default RecurringScheduleModel;
