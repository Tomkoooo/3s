"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { UploadIcon, XIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type ImageUploadProps = {
    onUploadComplete: (fileId: string) => void;
    existingImageId?: string;
    maxSizeMB?: number;
};

export default function ImageUpload({ 
    onUploadComplete, 
    existingImageId,
    maxSizeMB = 10 
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        existingImageId ? `/api/upload/${existingImageId}` : null
    );
    const [uploadedFileId, setUploadedFileId] = useState<string | null>(existingImageId || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Csak kép fájlokat lehet feltölteni');
            return;
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            toast.error(`A fájl mérete maximum ${maxSizeMB}MB lehet`);
            return;
        }

        try {
            setIsUploading(true);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Feltöltés sikertelen');
            }

            const data = await response.json();
            setUploadedFileId(data.fileId);
            onUploadComplete(data.fileId);
            toast.success('Kép sikeresen feltöltve');

        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Feltöltés sikertelen');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    }, [maxSizeMB, onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleRemove = useCallback(async () => {
        if (!uploadedFileId) return;

        try {
            const response = await fetch(`/api/upload/${uploadedFileId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Törlés sikertelen');
            }

            setPreviewUrl(null);
            setUploadedFileId(null);
            onUploadComplete(''); // Clear the field
            toast.success('Kép törölve');

        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Törlés sikertelen');
        }
    }, [uploadedFileId, onUploadComplete]);

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isUploading}
            />

            {previewUrl ? (
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                        disabled={isUploading}
                    >
                        <XIcon className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        w-full aspect-video border-2 border-dashed rounded-lg
                        flex flex-col items-center justify-center gap-2
                        transition-colors cursor-pointer
                        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
                    `}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            <p className="text-sm text-muted-foreground">Feltöltés...</p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            <div className="text-center">
                                <p className="text-sm font-medium">
                                    Kattints vagy húzd ide a képet
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, WebP (max. {maxSizeMB}MB)
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Fájl kiválasztása
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}



