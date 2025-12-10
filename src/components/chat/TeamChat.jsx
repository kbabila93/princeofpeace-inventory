import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, X, MessageSquare, User, Trash2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeamChat({ isOpen, onClose }) {
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const scrollRef = useRef(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                console.error("Not logged in");
            }
        };
        fetchUser();
    }, []);

    // Poll for new messages every 3 seconds
    const { data: messages = [] } = useQuery({
        queryKey: ['messages'],
        queryFn: () => base44.entities.Message.list('-created_date', 50),
        refetchInterval: 3000,
        enabled: isOpen,
    });

    const sortedMessages = [...messages].reverse();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessageMutation = useMutation({
        mutationFn: (text) => base44.entities.Message.create({
            text,
            sender_name: currentUser?.first_name || currentUser?.email?.split('@')[0] || "User",
            channel: "general"
        }),
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
    });

    const clearChatMutation = useMutation({
        mutationFn: async () => {
            const allMessages = await base44.entities.Message.list(null, 1000);
            await Promise.all(allMessages.map(msg => base44.entities.Message.delete(msg.id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success("Chat history cleared");
        },
        onError: () => {
            toast.error("Failed to clear chat");
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col h-[500px] animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Team Chat</h3>
                </div>
                <div className="flex items-center gap-1">
                    {currentUser?.role === 'admin' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="hover:bg-indigo-700 p-1 rounded transition-colors" title="Clear Chat">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all messages in the chat. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => clearChatMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                                        Clear Chat
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
                <div className="space-y-4">
                    {sortedMessages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No messages yet. Say hello!
                        </div>
                    )}
                    {sortedMessages.map((msg, i) => {
                        const isMe = msg.created_by === currentUser?.email;
                        return (
                            <div key={msg.id || i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="w-8 h-8 border bg-white">
                                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600">
                                        {msg.sender_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-600">{msg.sender_name}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <div 
                                        className={`p-3 rounded-lg text-sm shadow-sm ${
                                            isMe 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-white rounded-b-xl">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={sendMessageMutation.isPending || !newMessage.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}