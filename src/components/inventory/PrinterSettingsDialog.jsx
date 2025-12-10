import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PRESETS = {
  'standard': { width: 50, height: 30, name: 'Standard (50x30mm)' },
  'address': { width: 90, height: 29, name: 'Address Label (90x29mm)' },
  'shipping': { width: 100, height: 150, name: 'Shipping (4x6 inch)' },
  'jewellery': { width: 30, height: 15, name: 'Small/Jewellery (30x15mm)' },
};

export default function PrinterSettingsDialog({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings || {
    preset: 'standard',
    width: 50,
    height: 30,
    unit: 'mm'
  });

  const handlePresetChange = (val) => {
    if (val === 'custom') {
      setLocalSettings(prev => ({ ...prev, preset: 'custom' }));
    } else {
      setLocalSettings({
        preset: val,
        width: PRESETS[val].width,
        height: PRESETS[val].height,
        unit: 'mm'
      });
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Label Printer Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Label Size Preset</Label>
            <Select value={localSettings.preset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, data]) => (
                  <SelectItem key={key} value={key}>{data.name}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width ({localSettings.unit})</Label>
              <Input 
                type="number" 
                value={localSettings.width} 
                onChange={(e) => setLocalSettings({...localSettings, width: Number(e.target.value)})}
                disabled={localSettings.preset !== 'custom'}
              />
            </div>
            <div className="space-y-2">
              <Label>Height ({localSettings.unit})</Label>
              <Input 
                type="number" 
                value={localSettings.height} 
                onChange={(e) => setLocalSettings({...localSettings, height: Number(e.target.value)})}
                disabled={localSettings.preset !== 'custom'}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}