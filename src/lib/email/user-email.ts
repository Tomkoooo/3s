/**
 * User Email Service
 * 
 * Sends user-related emails (invites, password reset, etc.)
 */

import { sendEmail } from './smtp';
import {
    renderInviteEmail,
    renderInviteText,
    type InviteEmailData,
} from './templates';
import { brand } from '@/lib/brand';

/**
 * Send invite email to a user
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await sendEmail({
            to: data.recipientEmail,
            subject: `Meghívó a ${brand.emailFromSystemLabel}be`,
            html: renderInviteEmail(data),
            text: renderInviteText(data),
        });

        return result;
    } catch (error) {
        console.error('[INVITE EMAIL ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
