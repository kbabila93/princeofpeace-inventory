import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Save, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ShopCustomization() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => base44.entities.ShopSettings.list(),
  });

  const currentSettings = settings[0] || {
    shop_name: "StockFlow Shop",
    tagline: "Quality products delivered to you",
    hero_title: "Welcome to Our Store",
    hero_subtitle: "Discover amazing products at great prices",
    primary_color: "#4f46e5",
    secondary_color: "#9333ea",
    footer_text: "Quality products, excellent service",
    font_style: "modern"
  };

  const [formData, setFormData] = useState(currentSettings);

  React.useEffect(() => {
    if (settings[0]) {
      setFormData(settings[0]);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings[0]) {
        return base44.entities.ShopSettings.update(settings[0].id, data);
      } else {
        return base44.entities.ShopSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success("Shop settings saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save settings");
    }
  });

  const handleUpload = async (field) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, [field]: file_url });
        toast.success("Image uploaded!");
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const shopUrl = `${window.location.origin}${createPageUrl('PublicShop')}`;

  const fontClasses = {
    modern: "font-sans",
    classic: "font-serif",
    playful: "font-mono",
    elegant: "font-serif"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palette className="w-8 h-8 text-indigo-600" />
            Shop Customization
          </h1>
          <p className="text-gray-600 mt-2">Customize your public shop appearance</p>
        </div>
        <Button
          onClick={() => window.open(shopUrl, '_blank')}
          variant="outline"
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Preview Shop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Shop name, logo, and tagline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Shop Name</Label>
            <Input
              value={formData.shop_name}
              onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
              placeholder="StockFlow Shop"
            />
          </div>
          
          <div>
            <Label>Tagline</Label>
            <Input
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Quality products delivered to you"
            />
          </div>

          <div>
            <Label>Logo Image</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={formData.logo_url || ''}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
              <Button onClick={() => handleUpload('logo_url')} variant="outline" disabled={uploading}>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {formData.logo_url && (
              <img src={formData.logo_url} alt="Logo" className="mt-2 h-16 object-contain" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Main banner at the top of your shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Title</Label>
            <Input
              value={formData.hero_title}
              onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              placeholder="Welcome to Our Store"
            />
          </div>
          
          <div>
            <Label>Hero Subtitle</Label>
            <Input
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              placeholder="Discover amazing products at great prices"
            />
          </div>

          <div>
            <Label>Banner Background Image</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={formData.banner_image_url || ''}
                onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                placeholder="https://..."
              />
              <Button onClick={() => handleUpload('banner_image_url')} variant="outline" disabled={uploading}>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {formData.banner_image_url && (
              <img src={formData.banner_image_url} alt="Banner" className="mt-2 h-32 w-full object-cover rounded" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors & Style</CardTitle>
          <CardDescription>Customize your shop's appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                placeholder="#4f46e5"
              />
            </div>
          </div>

          <div>
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                placeholder="#9333ea"
              />
            </div>
          </div>

          <div>
            <Label>Font Style</Label>
            <Select value={formData.font_style} onValueChange={(value) => setFormData({ ...formData, font_style: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern (Sans-serif)</SelectItem>
                <SelectItem value="classic">Classic (Serif)</SelectItem>
                <SelectItem value="playful">Playful (Mono)</SelectItem>
                <SelectItem value="elegant">Elegant (Serif)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
          <CardDescription>Footer text and information</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Footer Description</Label>
          <Textarea
            value={formData.footer_text}
            onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
            placeholder="Quality products, excellent service"
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          disabled={saveMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}