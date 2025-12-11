import { Schema, models, model, Document, Model } from "mongoose";

export interface IInvite {
    role: 'auditor' | 'fixer' | 'admin';
    expiresAt: Date;
    createdAt: Date;
    comment: string;
}

const inviteSchema = new Schema<IInvite>({
    role: {
        type: String,
        enum: ['auditor', 'fixer', 'admin'],
        default: 'auditor',
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    comment: {
        type: String,
        default: "",
    }
})

// Index az expiresAt-re (automatic cleanup queryhez)
inviteSchema.index({ expiresAt: 1 });

export type InviteDocument = IInvite & Document;

const InviteModel = (models.Invite as Model<IInvite>) || model<IInvite>('Invite', inviteSchema);

export default InviteModel;