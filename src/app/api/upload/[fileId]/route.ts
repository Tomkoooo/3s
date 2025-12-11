import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB, getUploadsBucket } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * GET /api/upload/[fileId] - Download/serve image from GridFS
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const { fileId } = await params;

        await connectDB();
        const bucket = getUploadsBucket();

        // Validate ObjectId
        if (!ObjectId.isValid(fileId)) {
            return NextResponse.json(
                { error: 'Invalid file ID' },
                { status: 400 }
            );
        }

        // Get file metadata
        const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
        
        if (files.length === 0) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        const file = files[0];

        // Create download stream
        const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of downloadStream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Return image with proper headers
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': file.contentType || 'image/jpeg',
                'Content-Length': file.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Download failed' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/upload/[fileId] - Delete image from GridFS
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { fileId } = await params;

        await connectDB();
        const bucket = getUploadsBucket();

        // Validate ObjectId
        if (!ObjectId.isValid(fileId)) {
            return NextResponse.json(
                { error: 'Invalid file ID' },
                { status: 400 }
            );
        }

        // Get file metadata to check ownership
        const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
        
        if (files.length === 0) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        const file = files[0];

        // Check ownership (admin can delete any file)
        if (currentUser.role !== 'admin' && file.metadata?.uploadedBy !== currentUser.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Delete file
        await bucket.delete(new ObjectId(fileId));

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Delete failed' },
            { status: 500 }
        );
    }
}



