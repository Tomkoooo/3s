"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { UploadIcon, XIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type MultiImageUploadProps = {
    onImagesChange: (fileIds: string[]) => void;
    existingImageIds?: string[];
    maxSizeMB?: number;
    maxImages?: number;
};

export default function MultiImageUpload({ 
    onImagesChange, 
    existingImageIds = [],
    maxSizeMB = 10,
    maxImages = 5
}: MultiImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [images, setImages] = useState<Array<{ id: string; url: string }>>(
        existingImageIds.map(id => ({ id, url: `/api/upload/${id}` }))
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (files: FileList) => {
        // Check max images limit
        if (images.length + files.length > maxImages) {
            toast.error(`Maximum ${maxImages} kép tölthető fel`);
            return;
        }

        const validFiles: File[] = [];
        
        // Validate all files first
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name}: Csak kép fájlokat lehet feltölteni`);
                continue;
            }

            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                toast.error(`${file.name}: Maximum ${maxSizeMB}MB lehet`);
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        try {
            setIsUploading(true);
            const newImages: Array<{ id: string; url: string }> = [];

            // Upload each file
            for (const file of validFiles) {
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
                newImages.push({
                    id: data.fileId,
                    url: `/api/upload/${data.fileId}`
                });
            }

            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            onImagesChange(updatedImages.map(img => img.id));
            
            toast.success(`${newImages.length} kép sikeresen feltöltve`);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Feltöltés sikertelen');
        } finally {
            setIsUploading(false);
        }
    }, [maxSizeMB, maxImages, images, onImagesChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
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
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
    }, [handleFileSelect]);

    const handleRemove = useCallback(async (imageId: string, index: number) => {
        try {
            const response = await fetch(`/api/upload/${imageId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Törlés sikertelen');
            }

            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);
            onImagesChange(updatedImages.map(img => img.id));
            toast.success('Kép törölve');

        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Törlés sikertelen');
        }
    }, [images, onImagesChange]);

    return (
        <div className="w-full flex flex-col gap-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isUploading}
            />

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((image, index) => (
                        <div 
                            key={image.id} 
                            className="relative aspect-video bg-muted rounded-lg overflow-hidden group"
                        >
                            <Image
                                src={image.url}
                                alt={`Kép ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemove(image.id, index)}
                                disabled={isUploading}
                            >
                                <XIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {images.length < maxImages && (
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
                                    Kattints vagy húzd ide a képeket
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, WebP (max. {maxSizeMB}MB / kép)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {images.length} / {maxImages} kép feltöltve
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Képek kiválasztása
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
