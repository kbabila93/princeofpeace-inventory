import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Trash2, Image as ImageIcon, Camera, X } from "lucide-react";
import { toast } from "sonner";
import CameraCaptureDialog from '@/components/inventory/CameraCaptureDialog';

export default function ShopGallery() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const fileInputRef = React.useRef(null);

  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['shop-photos'],
    queryFn: () => base44.entities.ShopPhoto.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!imageUrl) throw new Error("Please upload an image");
      
      await base44.entities.ShopPhoto.create({
        title: title || "Shop Photo",
        image_url: imageUrl,
        category: category
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-photos'] });
      toast.success("Photo uploaded successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload photo");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ShopPhoto.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-photos'] });
      toast.success("Photo deleted");
    }
  });

  const handleFileUpload = async (fileOrEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      if (response?.file_url) {
        setImageUrl(response.file_url);
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setTitle("");
    setCategory("other");
    setImageUrl("");
  };

  const handleDelete = (photo) => {
    if (confirm(`Delete "${photo.title}"?`)) {
      deleteMutation.mutate(photo.id);
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    const cat = photo.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(photo);
    return acc;
  }, {});

  const categoryLabels = {
    storefront: "Store Front",
    interior: "Interior",
    products: "Products",
    team: "Team",
    events: "Events",
    other: "Other"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Gallery</h1>
          <p className="text-gray-500 mt-1">Upload and manage pictures of your shop</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-gray-500 mt-2">Loading gallery...</p>
        </div>
      ) : photos.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-4">Start uploading pictures of your shop</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload First Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPhotos).map(([cat, catPhotos]) => (
            <div key={cat}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {categoryLabels[cat] || cat}
                <span className="text-sm font-normal text-gray-500">({catPhotos.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {catPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div 
                      className="relative aspect-square bg-gray-100 cursor-pointer"
                      onClick={() => setViewingImage(photo)}
                    >
                      <img 
                        src={photo.image_url} 
                        alt={photo.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(photo);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-gray-900 truncate">{photo.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(photo.created_date).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload Shop Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Store entrance, Product display..."
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storefront">Store Front</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-start gap-4">
                {imageUrl ? (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 bg-gray-50">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => setIsCameraOpen(true)}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or enter image URL..."
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !imageUrl}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CameraCaptureDialog 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileUpload}
      />

      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{viewingImage.title}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full">
              <img 
                src={viewingImage.image_url} 
                alt={viewingImage.title}
                className="w-full rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="capitalize">{categoryLabels[viewingImage.category] || viewingImage.category}</span>
              <span>{new Date(viewingImage.created_date).toLocaleDateString()}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}