import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Megaphone, 
  Video, 
  Image as ImageIcon,
  Loader2,
  Share2,
  Copy,
  Sparkles,
  Edit,
  Check,
  X as XIcon,
  Save,
  History,
  Trash2,
  Download,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdvertGenerator() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("exciting");
  const [activeTab, setActiveTab] = useState("create");
  const [storeLocation, setStoreLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [useCustomBackground, setUseCustomBackground] = useState(false);
  const [useOriginalImage, setUseOriginalImage] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedText, setEditedText] = useState("");
  
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Load saved store info from user profile
  useEffect(() => {
    if (user?.store_location) {
      setStoreLocation(user.store_location);
    }
    if (user?.store_contact) {
      setContactInfo(user.store_contact);
    }
    if (user?.store_logo) {
      setLogoUrl(user.store_logo);
    }
  }, [user]);

  const { data: adverts = [] } = useQuery({
    queryKey: ['adverts'],
    queryFn: () => base44.entities.Advert.list('-created_date', 50),
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const saveAdvertMutation = useMutation({
    mutationFn: async () => {
      if (!generatedContent) return;
      await base44.entities.Advert.create({
        title: `${generatedContent.productName} - ${platform}`,
        content: generatedContent.text,
        media_url: generatedContent.imageUrl,
        media_type: "image",
        platform: platform,
        tone: tone,
        product_name: generatedContent.productName
      });
    },
    onSuccess: () => {
      toast.success("Advert saved to history");
      queryClient.invalidateQueries({ queryKey: ['adverts'] });
      setActiveTab("history");
    },
    onError: (e) => toast.error("Failed to save: " + e.message)
  });

  const deleteAdvertMutation = useMutation({
    mutationFn: (id) => base44.entities.Advert.delete(id),
    onSuccess: () => {
      toast.success("Advert deleted");
      queryClient.invalidateQueries({ queryKey: ['adverts'] });
    }
  });

  const handleSaveStoreInfo = async () => {
    setIsSavingInfo(true);
    try {
      await base44.auth.updateMe({
        store_location: storeLocation,
        store_contact: contactInfo,
        store_logo: logoUrl
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Store information saved');
    } catch (error) {
      toast.error('Failed to save store information');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const generateAdMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Please select a product");

      // 1. Generate Text
      const prompt = `Write a catchy social media post for a product named "${selectedProduct.name}".
      Product Description: ${selectedProduct.description || 'Amazing product'}.
      Price: ${selectedProduct.currency} ${selectedProduct.price}.
      Platform: ${platform}.
      Tone: ${tone}.
      ${storeLocation ? `Store Location: ${storeLocation}.` : ''}
      ${contactInfo ? `Contact: ${contactInfo}.` : ''}
      Include engaging emojis and hashtags. 
      ${storeLocation || contactInfo ? 'Include store location and contact information at the end.' : ''}
      Return ONLY the text content.`;

      // Execute generations in parallel
      const textPromise = base44.integrations.Core.InvokeLLM({ prompt });
      
      // 2. Get Image
      let imagePromise;

      if (useCustomBackground && customBackground) {
        // Generate with custom background
        const imagePrompt = `Professional product photography of ${selectedProduct.name}, ${customBackground}, 
        advertising style, high quality, 4k, cinematic lighting, trendy, appealing for ${platform} social media.`;
        
        const existingImages = (useOriginalImage && selectedProduct.image_url) ? [selectedProduct.image_url] : [];
        imagePromise = base44.integrations.Core.GenerateImage({ 
          prompt: imagePrompt,
          existing_image_urls: existingImages
        });
      } else if (useOriginalImage && selectedProduct.image_url) {
        // Use the actual product image as-is
        imagePromise = Promise.resolve({ url: selectedProduct.image_url });
      } else if (selectedProduct.image_url) {
        imagePromise = Promise.resolve({ url: selectedProduct.image_url });
      } else {
        const imagePrompt = `Professional product photography of ${selectedProduct.name}, ${selectedProduct.description}, 
        advertising style, high quality, 4k, cinematic lighting, trendy, appealing for ${platform} social media.`;
        
        imagePromise = base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      }

      const [textResponse, imageResponse] = await Promise.all([textPromise, imagePromise]);

      return {
        text: textResponse,
        imageUrl: imageResponse.url,
        productName: selectedProduct.name,
        price: `${selectedProduct.currency} ${selectedProduct.price}`
      };
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      setEditedText(data.text);
      setIsEditingContent(false);
      toast.success("Advert generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate advert: " + error.message);
    }
  });

  const handleCopy = () => {
    const textToCopy = isEditingContent ? editedText : generatedContent?.text;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Caption copied to clipboard");
    }
  };

  const handleSaveEdit = () => {
    setGeneratedContent({ ...generatedContent, text: editedText });
    setIsEditingContent(false);
    toast.success("Content updated");
  };

  const handleCancelEdit = () => {
    setEditedText(generatedContent.text);
    setIsEditingContent(false);
  };

  const handleShareToSocial = (platform) => {
    if (!generatedContent) return;
    
    const text = isEditingContent ? editedText : generatedContent.text;
    const imageUrl = generatedContent.imageUrl;
    
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        // Copy caption to clipboard for Facebook
        navigator.clipboard.writeText(text);
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`;
        toast.success('Caption copied! Paste it when sharing on Facebook');
        break;
      case 'linkedin':
        navigator.clipboard.writeText(text);
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}`;
        toast.success('Caption copied! Paste it when sharing on LinkedIn');
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + imageUrl)}`;
        break;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-indigo-600" />
          Advert Generator
        </h1>
        <p className="text-gray-500">Create AI-powered social media adverts for your products in seconds.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Create New
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Saved Adverts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Choose your target and style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exciting">Exciting & Energetic</SelectItem>
                  <SelectItem value="professional">Professional & Clean</SelectItem>
                  <SelectItem value="minimalist">Minimalist & Modern</SelectItem>
                  <SelectItem value="luxury">Luxury & Premium</SelectItem>
                  <SelectItem value="urgent">Urgent (Sale/Limited)</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Store Location (Optional)</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveStoreInfo}
                  disabled={isSavingInfo || (!storeLocation && !contactInfo && !logoUrl)}
                  className="h-auto py-1 text-xs"
                >
                  {isSavingInfo ? 'Saving...' : 'Save Info'}
                </Button>
              </Label>
              <Input
                placeholder="123 Main St, City"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Info (Optional)</Label>
              <Input
                placeholder="Phone or email"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Store Logo (Optional)</Label>
              <div className="flex gap-2 items-center">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain border rounded" />
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              {isUploadingLogo && <p className="text-xs text-gray-500">Uploading...</p>}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label>Image Settings</Label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOriginalImage}
                  onChange={(e) => setUseOriginalImage(e.target.checked)}
                  className="rounded"
                  disabled={!selectedProduct?.image_url}
                />
                <span className="text-sm text-gray-600">Use actual product image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomBackground}
                  onChange={(e) => setUseCustomBackground(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Apply custom background</span>
              </label>
              {useCustomBackground && (
                <Textarea
                  placeholder="Describe the background... (e.g., 'modern studio with soft lighting', 'outdoor nature scene', 'minimalist white background')"
                  value={customBackground}
                  onChange={(e) => setCustomBackground(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              )}
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => generateAdMutation.mutate()}
              disabled={!selectedProductId || generateAdMutation.isPending}
            >
              {generateAdMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Advert
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-2">
          {generatedContent ? (
            <Tabs defaultValue="image" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Image Post
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="w-4 h-4" /> Video Story
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2 flex-wrap">
                  {!isEditingContent ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingContent(true)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Caption
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <XIcon className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 mr-2" /> Save Changes
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => saveAdvertMutation.mutate()} disabled={saveAdvertMutation.isPending}>
                    {saveAdvertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Caption
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareToSocial('facebook')} className="text-blue-600 hover:text-blue-700">
                    <Facebook className="w-4 h-4 mr-2" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareToSocial('twitter')} className="text-sky-500 hover:text-sky-600">
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareToSocial('linkedin')} className="text-blue-700 hover:text-blue-800">
                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareToSocial('whatsapp')} className="text-green-600 hover:text-green-700">
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                </div>
              </div>

              <TabsContent value="image" className="mt-0">
                <Card>
                  <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                    <div className="relative group rounded-lg overflow-hidden border bg-gray-100">
                      <img 
                        src={generatedContent.imageUrl} 
                        alt="Generated Ad" 
                        className="w-full h-auto object-cover"
                      />
                      {logoUrl && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                          <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" onClick={() => window.open(generatedContent.imageUrl, '_blank')}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase mb-2">
                        <Share2 className="w-4 h-4" />
                        Caption
                      </div>
                      {isEditingContent ? (
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="min-h-[200px] text-sm"
                        />
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm border">
                          {generatedContent.text}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="max-w-xs mx-auto aspect-[9/16] bg-black rounded-xl overflow-hidden relative shadow-2xl">
                        {/* Video Story Animation */}
                        <motion.div 
                            className="absolute inset-0"
                            animate={{ scale: [1, 1.1] }}
                            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                        >
                            <img 
                                src={generatedContent.imageUrl} 
                                alt="Background" 
                                className="w-full h-full object-cover opacity-80"
                            />
                        </motion.div>
                        
                        {logoUrl && (
                          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 flex flex-col justify-end p-6 text-white">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h3 className="text-2xl font-bold mb-2">{generatedContent.productName}</h3>
                                <div className="text-3xl font-bold text-yellow-400 mb-4">{generatedContent.price}</div>
                                <p className="text-sm line-clamp-3 opacity-90 mb-6 font-medium">
                                    {generatedContent.text}
                                </p>
                                <Button className="w-full bg-white text-black hover:bg-gray-200">
                                    Shop Now
                                </Button>
                            </motion.div>
                        </div>

                        {/* Stories Progress Bar */}
                        <div className="absolute top-4 left-4 right-4 flex gap-1">
                            <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-6 text-gray-500 text-sm">
                        <p>Video Preview Mode</p>
                        <p className="text-xs mt-1">Screen record this preview or use the image assets to create your reel.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">Ready to create something amazing?</p>
              <p className="text-sm">Select a product and click Generate</p>
            </div>
          )}
        </div>
      </div>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adverts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No saved adverts yet.</p>
            </div>
          ) : (
            adverts.map((ad) => (
              <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative group bg-gray-100">
                  <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => window.open(ad.media_url, '_blank')}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteAdvertMutation.mutate(ad.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate pr-2">{ad.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize text-gray-600">
                      {ad.platform}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">{ad.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{new Date(ad.created_date).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" className="h-6" onClick={() => {
                        navigator.clipboard.writeText(ad.content);
                        toast.success("Content copied");
                    }}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
}