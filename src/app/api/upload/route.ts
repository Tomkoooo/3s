import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB, getUploadsBucket } from '@/lib/db';
import { Readable } from 'stream';

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/upload - Upload image to GridFS
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        // Connect to DB and get GridFS bucket
        await connectDB();
        const bucket = getUploadsBucket();

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create upload stream
        const uploadStream = bucket.openUploadStream(file.name, {
            contentType: file.type,
            metadata: {
                uploadedBy: currentUser.id,
                uploadedAt: new Date(),
                originalName: file.name,
                size: file.size,
            },
        });

        // Write buffer to stream
        const readable = Readable.from(buffer);
        await new Promise((resolve, reject) => {
            readable.pipe(uploadStream)
                .on('finish', resolve)
                .on('error', reject);
        });

        return NextResponse.json({
            success: true,
            fileId: uploadStream.id.toString(),
            filename: file.name,
            contentType: file.type,
            size: file.size,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/upload - List user's uploads
 */
export async function GET() {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        const bucket = getUploadsBucket();

        // Get uploads from GridFS
        const files = await bucket.find({
            'metadata.uploadedBy': currentUser.id
        }).toArray();

        return NextResponse.json({
            success: true,
            files: files.map(file => ({
                id: file._id.toString(),
                filename: file.filename,
                contentType: file.contentType,
                size: file.length,
                uploadDate: file.uploadDate,
            })),
        });

    } catch (error) {
        console.error('List uploads error:', error);
        return NextResponse.json(
            { error: 'Failed to list uploads' },
            { status: 500 }
        );
    }
}



