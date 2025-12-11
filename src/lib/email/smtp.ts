/**
 * SMTP Email Service
 * 
 * Nodemailer wrapper for sending emails
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email configuration from environment variables
 */
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'Audit System <noreply@example.com>',
};

/**
 * Email attachment type
 */
export type EmailAttachment = {
    filename: string;
    content: string | Buffer;
    contentType?: string;
};

/**
 * Email options
 */
export type SendEmailOptions = {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: EmailAttachment[];
    replyTo?: string;
};

/**
 * Create SMTP transporter (singleton)
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
    if (!transporter) {
        // Check if SMTP is configured
        if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
            console.warn(
                'SMTP not configured. Email sending will be simulated. ' +
                'Set SMTP_USER and SMTP_PASSWORD environment variables.'
            );
        }

        transporter = nodemailer.createTransport({
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            secure: EMAIL_CONFIG.secure,
            auth: EMAIL_CONFIG.auth,
        });
    }

    return transporter;
}

/**
 * Send email with retry logic
 */
export async function sendEmail(
    options: SendEmailOptions,
    retries: number = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // If SMTP not configured, simulate sending
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        console.log('[EMAIL SIMULATION] Would send email:', {
            to: options.to,
            subject: options.subject,
            hasHtml: !!options.html,
            hasAttachments: !!options.attachments?.length,
        });
        return {
            success: true,
            messageId: `simulated-${Date.now()}`,
        };
    }

    const transport = getTransporter();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const info = await transport.sendMail({
                from: EMAIL_CONFIG.from,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
                replyTo: options.replyTo,
            });

            console.log('[EMAIL SUCCESS]', {
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error(`[EMAIL ERROR] Attempt ${attempt}/${retries}:`, error);

            if (attempt === retries) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }

            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
    }

    return {
        success: false,
        error: 'Max retries reached',
    };
}

/**
 * Send email to multiple recipients (batch)
 */
export async function sendBatchEmail(
    recipients: string[],
    emailOptions: Omit<SendEmailOptions, 'to'>
): Promise<{
    success: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
}> {
    const results = await Promise.allSettled(
        recipients.map((email) =>
            sendEmail({
                ...emailOptions,
                to: email,
            })
        )
    );

    let success = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            success++;
        } else {
            failed++;
            errors.push({
                email: recipients[index],
                error:
                    result.status === 'fulfilled'
                        ? result.value.error || 'Unknown error'
                        : 'Promise rejected',
            });
        }
    });

    return { success, failed, errors };
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<{
    success: boolean;
    error?: string;
}> {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        return {
            success: false,
            error: 'SMTP not configured',
        };
    }

    try {
        const transport = getTransporter();
        await transport.verify();
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}


