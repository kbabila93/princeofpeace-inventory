import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  User, 
  Clock, 
  Calendar, 
  Search, 
  History,
  PhoneIncoming,
  PhoneOutgoing,
  Delete,
  Hash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CallCenter() {
  const [activeTab, setActiveTab] = useState("dialer");
  const [dialNumber, setDialNumber] = useState("");
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [callNotes, setCallNotes] = useState("");
  
  const timerRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch contacts (Customers, Suppliers, Employees)
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });
  
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['callLogs'],
    queryFn: () => base44.entities.CallLog.list('-timestamp', 50),
  });

  const allContacts = [
    ...customers.map(c => ({ ...c, type: 'Customer', displayIdentifier: c.email })),
    ...suppliers.map(s => ({ ...s, type: 'Supplier', displayIdentifier: s.email })),
    ...employees.map(e => ({ ...e, type: 'Employee', displayIdentifier: e.email }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const logCallMutation = useMutation({
    mutationFn: (data) => base44.entities.CallLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callLogs'] });
      toast.success("Call logged successfully");
    }
  });

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const handleDigitClick = (digit) => {
    if (callStatus === 'idle') {
      setDialNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setDialNumber(prev => prev.slice(0, -1));
  };

  const startCall = () => {
    if (!dialNumber && !selectedContact) {
      toast.error("Enter a number or select a contact");
      return;
    }
    setCallStatus("calling");
    
    // Simulate connection delay
    setTimeout(() => {
      setCallStatus("connected");
      toast.success("Call connected");
    }, 1500);
  };

  const endCall = () => {
    setCallStatus("ended");
    
    // Log the call
    logCallMutation.mutate({
      contact_name: selectedContact?.name || "Unknown",
      contact_number: dialNumber || selectedContact?.phone || "Unknown",
      direction: "outbound",
      status: "completed",
      duration: callDuration,
      notes: callNotes,
      timestamp: new Date().toISOString()
    });

    // Reset after a delay
    setTimeout(() => {
      setCallStatus("idle");
      setCallDuration(0);
      setCallNotes("");
      setDialNumber("");
      setSelectedContact(null);
    }, 2000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectContact = (contact) => {
    setSelectedContact(contact);
    setDialNumber(contact.phone || "");
    setActiveTab("dialer");
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Left Panel - Dialer & Active Call */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card className="flex-1 border-indigo-100 shadow-lg flex flex-col">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
            <div className="text-center">
              <div className="h-4 text-sm font-medium text-indigo-600 mb-1">
                {callStatus === 'calling' ? 'Calling...' : 
                 callStatus === 'connected' ? 'Connected' : 
                 callStatus === 'ended' ? 'Call Ended' : 'Ready to Call'}
              </div>
              <div className="text-3xl font-bold text-gray-900 h-10 truncate px-4">
                {selectedContact ? selectedContact.name : (dialNumber || "Enter Number")}
              </div>
              <div className="h-6 text-sm text-gray-500 mt-1">
                {callStatus === 'connected' ? formatDuration(callDuration) : (selectedContact?.phone || "")}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-6">
            {/* Keypad */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
                  <Button
                    key={digit}
                    variant="outline"
                    className="h-14 text-xl font-medium rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    onClick={() => handleDigitClick(digit)}
                  >
                    {digit}
                  </Button>
                ))}
              </div>
            )}

            {/* Active Call Controls */}
            {callStatus === 'connected' && (
              <div className="flex-1 flex flex-col justify-center items-center gap-8 py-8">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                    {selectedContact?.name?.charAt(0) || <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="w-full space-y-2">
                  <label className="text-xs font-medium text-gray-500 ml-1">Call Notes</label>
                  <Textarea 
                    placeholder="Type notes during call..." 
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="h-24 resize-none bg-yellow-50/50 border-yellow-100 focus:border-yellow-200 focus:ring-yellow-100"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto grid grid-cols-3 gap-4 items-center">
              {callStatus === 'idle' ? (
                <>
                  <div />
                  <Button 
                    size="lg" 
                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200"
                    onClick={startCall}
                  >
                    <Phone className="w-6 h-6 text-white" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleBackspace}
                    className="justify-self-center text-gray-400 hover:text-red-500"
                  >
                    <Delete className="w-6 h-6" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={`h-14 w-14 rounded-full ${isMuted ? 'bg-gray-100 text-red-500 border-red-200' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
                    onClick={endCall}
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </Button>
                  <div />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Contacts & History */}
      <div className="w-full md:w-2/3 flex flex-col h-full bg-white rounded-xl border shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
            <TabsList>
              <TabsTrigger value="dialer">Contacts</TabsTrigger>
              <TabsTrigger value="history">Call History</TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-8 h-9" />
            </div>
          </div>

          <TabsContent value="dialer" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {allContacts.map((contact, i) => (
                  <div 
                    key={contact.id || i} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => selectContact(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border bg-white">
                        <AvatarFallback className="text-indigo-600 bg-indigo-50">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="capitalize">{contact.type}</span>
                          {contact.phone && (
                            <>
                              <span>•</span>
                              <span>{contact.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-600">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {callLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No call history yet.</div>
                ) : (
                  callLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          {log.direction === 'inbound' ? (
                            <PhoneIncoming className="w-4 h-4 text-blue-500" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-green-500" />
                          )}
                          {log.contact_name}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-500">
                          {log.contact_number} • {formatDuration(log.duration)}
                        </div>
                        <Badge variant="outline" className={
                          log.status === 'missed' ? 'text-red-600 bg-red-50 border-red-200' : 'text-gray-600'
                        }>
                          {log.status}
                        </Badge>
                      </div>
                      {log.notes && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}