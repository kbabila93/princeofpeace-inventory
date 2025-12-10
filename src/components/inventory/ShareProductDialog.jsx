import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { toast } from "sonner";

export default function ShareProductDialog({ isOpen, onClose, product }) {
  const [copied, setCopied] = React.useState(false);

  if (!product) return null;

  // Create a deep link to the product using the search parameter
  // This assumes the Inventory page is at /Inventory
  const shareUrl = `${window.location.origin}/Inventory?search=${encodeURIComponent(product.sku || product.name)}`;
  
  const shareText = `Check out ${product.name} - ${product.currency} ${Number(product.price).toFixed(2)}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocial = (platform) => {
    let url = '';
    const text = encodeURIComponent(shareText);
    const link = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Check out ${product.name}`)}&body=${text}%0A%0A${link}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Product</DialogTitle>
          <DialogDescription>
            Share details for <span className="font-medium text-foreground">{product.name}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input id="link" defaultValue={shareUrl} readOnly className="h-9" />
            </div>
            <Button size="sm" className="px-3" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => openSocial('twitter')}>
              <Twitter className="h-5 w-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => openSocial('facebook')}>
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => openSocial('linkedin')}>
              <Linkedin className="h-5 w-5 text-blue-700" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => openSocial('email')}>
              <Mail className="h-5 w-5 text-gray-600" />
              <span className="text-xs">Email</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}