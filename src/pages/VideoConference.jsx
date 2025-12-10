import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Video, Mic, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function VideoConference() {
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setDisplayName(u.full_name || u.email.split('@')[0]);
      // Generate a random room name if none exists
      if (!roomName) {
        setRoomName(`StockFlow-${Math.random().toString(36).substring(7)}`);
      }
    }).catch(() => {});
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    setIsJoined(true);
  };

  const copyLink = () => {
    const url = `https://meet.jit.si/${roomName}`;
    navigator.clipboard.writeText(url);
    toast.success("Meeting link copied to clipboard");
  };

  if (isJoined) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsJoined(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave
            </Button>
            <span className="text-white font-medium flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              {roomName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
        <div className="flex-1 relative bg-black">
          <iframe
            src={`https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName="${encodeURIComponent(displayName)}"`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Jitsi Meet"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <Video className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Video Conference</h1>
        <p className="text-gray-500 mt-2">Start or join a secure video meeting with your team.</p>
      </div>

      <Card className="border-indigo-100 shadow-lg">
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
          <CardDescription>Enter a room name to join instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Room Name</label>
              <div className="relative">
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. DailyStandup"
                  className="pl-10"
                />
                <Video className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500">
                Share this room name with others to let them join.
              </p>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 size-lg mt-2">
              Join Meeting
            </Button>
            
            <p className="text-xs text-center text-gray-400 mt-4">
              Powered by Jitsi Meet. No download required.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}