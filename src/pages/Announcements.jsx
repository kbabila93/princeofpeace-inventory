import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Radio, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  AlertCircle, 
  Info, 
  Megaphone,
  CheckCircle2,
  Archive,
  Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Announcements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState("published"); // published, archived, all
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin';

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 50),
  });

  const filteredAnnouncements = announcements.filter(a => {
    if (!isAdmin && a.status !== 'published') return false; // Users only see published
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create({
      ...data,
      author_name: user?.full_name || user?.email || 'Admin'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast.success("Announcement posted");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.update(editingItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast.success("Announcement updated");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success("Announcement deleted");
    }
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this announcement permanently?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'important': return <Info className="w-5 h-5 text-orange-600" />;
      default: return <Megaphone className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Radio className="w-8 h-8 text-indigo-600" />
            Announcement Center
          </h1>
          <p className="text-gray-500 mt-1">Stay updated with the latest news and important notices.</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading updates...</div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500">No announcements to display at the moment.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredAnnouncements.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${item.priority === 'critical' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl h-fit ${
                        item.priority === 'critical' ? 'bg-red-50' : 
                        item.priority === 'important' ? 'bg-orange-50' : 'bg-blue-50'
                      }`}>
                        {getPriorityIcon(item.priority)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="outline" className={getPriorityColor(item.priority)}>
                            {item.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.created_date), 'PPP')}
                          </span>
                          {isAdmin && item.status !== 'published' && (
                            <Badge variant="secondary" className="text-xs">
                              {item.status}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
                        <div className="prose prose-sm text-gray-600 max-w-none whitespace-pre-wrap">
                          {item.content}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                          <span>Posted by {item.author_name}</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {item.status === 'published' ? (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ ...item, status: 'archived' })}>
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ ...item, status: 'published' })}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnnouncementDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onSubmit={(data) => {
          if (editingItem) updateMutation.mutate(data);
          else createMutation.mutate(data);
        }}
        initialData={editingItem}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function AnnouncementDialog({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    status: "published"
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          content: initialData.content,
          priority: initialData.priority,
          status: initialData.status
        });
      } else {
        setFormData({
          title: "",
          content: "",
          priority: "normal",
          status: "published"
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Announcement' : 'Post Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="What's happening?"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea 
              id="content"
              value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Write your announcement details here..."
              className="min-h-[150px]"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Post Now')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}