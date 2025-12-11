import { Schema, models, model, Document, ObjectId } from "mongoose";

export type IAuditResult = {
    check: ObjectId;
    result: boolean;
    comment?: string;
    image?: ObjectId;
    durationMinutes?: number;
    fixedBy?: ObjectId;
    fixedAt?: Date;
    fixComment?: string;
    fixImage?: ObjectId;
}

export const auditResultSchema = new Schema<IAuditResult>({
    check: {
        type: Schema.Types.ObjectId,
        ref: "Check",
        required: true,
    },
    result: { // true = OK, false = NOK
        type: Boolean,
        required: false,
    },
    comment: {
        type: String,
        required: function(this: any) { return this.result === false; } // Kötelező ha NOK
    },
    image: {
        type: Schema.Types.ObjectId, // GridFS ID
        ref: "Upload", // Model név string-ként
        required: false, // TEMPORARY FOR TESTING
    },
    // Fixer fields
    fixedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    fixedAt: {
        type: Date,
    },
    fixComment: {
        type: String,
    },
    fixImage: {
        type: Schema.Types.ObjectId, // GridFS ID
        ref: "Upload",
    }
})

export type IAudit = {
    site: ObjectId;
    participants: ObjectId[];
    onDate: Date;
    startTime?: Date;
    endTime?: Date;
    status: 'scheduled' | 'in_progress' | 'completed';
    result: IAuditResult[];
}

export const auditSchema = new Schema<IAudit>({
    site: {
        type: Schema.Types.ObjectId,
        ref: "Site",
        required: true,
    },
    participants: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        required: true,
    },
    onDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: Date,
        required: false,
    },
    endTime: {
        type: Date,
        required: false,
    },
    result: {
        type: [auditResultSchema],
        required: true,
    },
})

// Indexek a gyors queryért
auditSchema.index({ site: 1, onDate: 1 });
auditSchema.index({ participants: 1, onDate: 1 });
auditSchema.index({ onDate: 1 });

export type AuditDocument = IAudit & Document;

auditSchema.virtual('status').get(function () {
    if (this.startTime && this.endTime) {
        return 'completed';
    }
    if (this.startTime) {
        return 'in_progress';
    }
    return 'scheduled';
})

auditSchema.virtual('durationMinutes').get(function () {
    if (this.startTime && this.endTime) {
        return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
    }
    return 0;
})

const Audit = models.Audit || model<IAudit>('Audit', auditSchema);

export default Audit;