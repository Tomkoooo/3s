import { connections, connect, mongo } from 'mongoose';
import dayjs from '@/lib/dayjs';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
}

let connectionPromise: Promise<typeof import('mongoose')> | null = null;

export const connectDB = async (): Promise<void> => {
    // If already connected, return immediately
    if (connections[0]?.readyState === 1) {
        return;
    }
    
    // If connection in progress, reuse the same promise
    if (connectionPromise) {
        await connectionPromise;
        return;
    }
    
    try {
        connectionPromise = connect(MONGODB_URI, {
            dbName: '3s-gp',
            serverSelectionTimeoutMS: 10000, // 10 sec
            socketTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            bufferCommands: false, // Don't buffer - fail fast
        });
        
        await connectionPromise;
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        connectionPromise = null;
        throw error;
    }
};

/**
 * Deletes past breaks for all users
 * - If break has an end date, checks if the end date has passed
 * - If break has no end date, checks if the start date has passed
 * @returns Promise<{ deletedCount: number }> - Number of breaks deleted
 */
export const deletePastBreaks = async (): Promise<{ deletedCount: number }> => {
    try {
        // Lazy import to avoid importing Break model in middleware (Edge runtime issue)
        const Break = (await import('./models/Break')).default;
        
        await connectDB();

        const today = dayjs().format('YYYY-MM-DD');

        // Find all breaks where:
        // 1. end date exists and has passed, OR
        // 2. end date doesn't exist and start date has passed
        const result = await Break.deleteMany({
            $or: [
                // Case 1: Has end date and end date has passed
                {
                    end: { $exists: true, $ne: null, $lt: today }
                },
                // Case 2: No end date and start date has passed
                {
                    end: { $exists: false },
                    start: { $lt: today }
                },
                // Case 3: end is null/empty and start date has passed
                {
                    end: { $in: [null, ''] },
                    start: { $lt: today }
                }
            ]
        });

        return { deletedCount: result.deletedCount };
    } catch (error) {
        console.error('Error deleting past breaks:', error);
        throw error;
    }
};

/**
 * Native MongoDB client, you can use this to access the database without constrains.
 * Lazy initialized to avoid Edge Runtime issues.
 */
let _nativeClient: mongo.MongoClient | null = null;
export const getNativeClient = () => {
    if (!_nativeClient) {
        _nativeClient = new mongo.MongoClient(MONGODB_URI);
    }
    return _nativeClient;
};

/**
 * GridFS bucket for uploads
 * Lazy initialized to avoid Edge Runtime issues.
 */
let _uploadsBucket: mongo.GridFSBucket | null = null;
export const getUploadsBucket = () => {
    if (!_uploadsBucket) {
        const client = getNativeClient();
        _uploadsBucket = new mongo.GridFSBucket(client.db("3s-gp"), {
            bucketName: "uploads",
        });
    }
    return _uploadsBucket;
};