import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Fetch notifications that are either for everyone (no recipient) or for this user
      // Note: complex filtering might be limited, so we'll fetch recent and filter in client if needed
      // or assuming the backend supports simple filtering.
      // For now, let's just list all and filter client side for MVP or assume simple usage
      return await base44.entities.Notification.list('-created_date', 20);
    },
  });

  const myNotifications = notifications.filter(n => 
    (!n.recipient_email || (user && n.recipient_email === user.email)) &&
    (user && n.created_by !== user.email) // Don't show my own notifications
  );

  const unreadCount = myNotifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = myNotifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
    
    if (notification.link === '#chat') {
        window.dispatchEvent(new Event('open-chat'));
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 text-xs text-indigo-600 hover:text-indigo-700"
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {myNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {myNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${notification.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {format(new Date(notification.created_date || new Date()), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}