'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Mic,
  MicOff,
  Settings,
  Database,
  FileText,
  Globe,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  Upload,
  Link,
  Trash2,
  RefreshCw,
  Copy,
  User,
  Bot,
  AlertCircle,
  Languages,
  Image as ImageIcon,
  LogOut,
  LogIn,
  Shield,
  History,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
  audioUrl?: string;
  image?: string;
}

interface KnowledgeSource {
  id: string;
  type: 'pdf' | 'web' | 'database' | 'adera';
  name: string;
  url?: string;
  content?: string;
  enabled: boolean;
  addedAt: Date;
}

interface ChatSettings {
  voiceOutput: boolean;
  voiceInput: boolean;
  autoScroll: boolean;
  showSources: boolean;
  contextLength: number;
}

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'customer' | 'driver' | 'partner';
  email: string;
}

// Default Adera knowledge sources (used initially and restorable by Admin)
const DEFAULT_ADERA_KNOWLEDGE: KnowledgeSource[] = [
  { id: 'adera-1', type: 'adera', name: 'Adera Project & Workflows', url: 'https://adera-project-context-workflows-dg.netlify.app/', enabled: true, addedAt: new Date() },
  { id: 'adera-2', type: 'adera', name: 'Adera Hybrid App (GitHub)', url: 'https://github.com/mbet-dev/adera-hybrid-app.git', enabled: true, addedAt: new Date() },
  { id: 'adera-3', type: 'adera', name: 'Adera Context', url: 'https://adera-hybrid-app-context-4vc.netlify.app/', enabled: true, addedAt: new Date() },
  { id: 'adera-4', type: 'adera', name: 'Adera Introduction', url: 'https://adera-intro-web.netlify.app/', enabled: true, addedAt: new Date() },
  { id: 'adera-5', type: 'adera', name: 'Adera Demo (Vercel)', url: 'https://mbet-adera-1.vercel.app/', enabled: true, addedAt: new Date() },
  { id: 'adera-6', type: 'adera', name: 'Adera Upcoming', url: 'https://adera-upcoming.netlify.app/', enabled: true, addedAt: new Date() },
];

const TRANSLATIONS = {
  title: 'AderaBot-Hermes',
  subtitle: 'AI Knowledge Assistant',
  welcome: 'Hello! I am AderaBot-Hermes, your AI assistant for Adera-Hybrid-App.',
  welcome2: 'How can I assist you today?',
  welcomeAdmin: 'Welcome Admin! You have full access to manage the knowledge base.',
  welcomeUser: (username: string) => `Welcome ${username}! You can view and toggle knowledge sources, and query your personal data.`,
  placeholder: 'Ask AderaBot-Hermes anything...',
  sending: 'Sending...',
  knowledgeBase: 'Knowledge Base',
  manageKnowledge: 'Manage your knowledge sources',
  viewKnowledge: 'View knowledge sources',
  activeSources: 'Active Sources',
  addWebSource: 'Add Web Source',
  addPdf: 'Add PDF Document',
  noSources: 'No knowledge sources added yet.',
  uploadPdf: 'Click to upload PDF',
  settings: 'Settings',
  voiceOutput: 'Voice Output',
  voiceInput: 'Voice Input',
  autoScroll: 'Auto Scroll',
  showSources: 'Show Sources',
  contextLength: 'Context Length',
  clearChat: 'Clear Chat',
  chatCleared: 'Chat history cleared.',
  sourceRemoved: 'Knowledge source removed.',
  sourceAdded: 'Source added successfully.',
  errorSending: 'Failed to send message. Please try again.',
  errorTranscribe: 'Failed to transcribe audio. Please try again.',
  errorMic: 'Microphone access is not supported.',
  errorMicPerm: 'Failed to access microphone. Please check permissions.',
  errorWebSource: 'Failed to add web source. Please try again.',
  errorPdf: 'Failed to upload PDF.',
  errorLogin: 'Invalid username or password.',
  errorImage: 'Failed to analyze image.',
  stopRecording: 'Stop Recording',
  startRecording: 'Start Voice Input',
  enableVoice: 'Enable Voice Output',
  disableVoice: 'Disable Voice Output',
  copied: 'Copied',
  copiedMessage: 'Message copied to clipboard.',
  sources: 'Sources',
  poweredBy: 'Powered by Adera-Hybrid-App',
  knowledgeCount: 'Knowledge Sources',
  login: 'Login',
  logout: 'Logout',
  username: 'Username',
  password: 'Password',
  loginAsAdmin: 'Login as Admin',
  loginAsUser: 'Login as User',
  admin: 'Admin',
  customer: 'Customer',
  driver: 'Driver',
  partner: 'Partner',
  uploadImage: 'Upload Image',
  analyzeImage: 'Analyze Image',
  selectImage: 'Select an image to analyze...',
  myData: 'My Data',
  viewMyData: 'View my personal data',
  queryUserData: 'Query my delivery data',
  loadingData: 'Loading your data...',
  noData: 'No data available.',
  deliveries: 'Deliveries',
  recentConversations: 'Recent Conversations',
  conversationHistory: 'Conversation History',
  noHistory: 'No conversation history yet.',
};

export default function AderaBotHermes() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    voiceOutput: false,
    voiceInput: false,
    autoScroll: true,
    showSources: true,
    contextLength: 10,
  });

  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([
    {
      id: '1',
      type: 'database',
      name: 'User & Delivery Database',
      enabled: true,
      addedAt: new Date(),
    },
  ]);
  const [aderaKnowledge, setAderaKnowledge] = useState<KnowledgeSource[]>(() => DEFAULT_ADERA_KNOWLEDGE.map(s => ({ ...s, addedAt: new Date() })));

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User data
  const [userData, setUserData] = useState<any>(null);
  const [showUserData, setShowUserData] = useState(false);

  const [newWebUrl, setNewWebUrl] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const { toast } = useToast();

  const t = TRANSLATIONS;

  // Initialize on mount
  useEffect(() => {
    if (!mounted) {
      setMounted(true);

      // Check for stored auth
      const storedUser = localStorage.getItem('adera_user');
      const storedToken = localStorage.getItem('adera_token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);

        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: t.welcomeUser(JSON.parse(storedUser).username),
            timestamp: new Date(),
            sources: [],
          },
        ]);
      } else {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: t.welcome + ' ' + t.welcome2,
            timestamp: new Date(),
            sources: [],
          },
        ]);
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (settings.autoScroll && scrollRef.current && mounted) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, settings.autoScroll, mounted]);

  // Login handler
  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter username and password',
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('adera_user', JSON.stringify(data.user));
      localStorage.setItem('adera_token', data.token);

      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });

      // Update welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: data.user.role === 'admin'
            ? t.welcomeAdmin
            : t.welcomeUser(data.user.username),
          timestamp: new Date(),
          sources: [],
        },
      ]);

      toast({
        title: 'Success',
        description: `Logged in as ${data.user.username} (${data.user.role})`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || t.errorLogin,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setUserData(null);
    setShowUserData(false);
    localStorage.removeItem('adera_user');
    localStorage.removeItem('adera_token');

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: t.welcome + ' ' + t.welcome2,
        timestamp: new Date(),
        sources: [],
      },
    ]);

    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
  };

  // Image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, query: '' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Failed to fetch user data');
      }

      setUserData(data.data);
      setShowUserData(true);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch user data',
      });
    }
  };

  // Toggle knowledge source
  const toggleKnowledgeSource = (id: string) => {
    setKnowledgeSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, enabled: !source.enabled } : source
      )
    );
  };

  // Restore default Adera links (Admin can use after removing some)
  const loadAderaKnowledge = () => {
    setAderaKnowledge(DEFAULT_ADERA_KNOWLEDGE.map(s => ({ ...s, addedAt: new Date() })));
    toast({ title: 'Success', description: 'Default Adera knowledge sources restored.' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      image: imagePreview,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentImage = selectedImage;
    handleRemoveImage();
    setIsLoading(true);

    try {
      // Prepare image data (browser-safe: no Node Buffer)
      let imageData: string | undefined;
      if (currentImage) {
        const bytes = await currentImage.arrayBuffer();
        const uint8 = new Uint8Array(bytes);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        imageData = btoa(binary);
      }

      // Get enabled sources
      const allSources = [...knowledgeSources, ...aderaKnowledge];
      const enabledSources = allSources.filter(s => s.enabled);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-settings.contextLength),
          settings,
          knowledgeSources: enabledSources,
          token,
          imageData,
          queryUserData: true,
        }),
      });

      let data: { response?: string; error?: string; details?: string; sources?: string[]; audioUrl?: string; userData?: unknown };
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const serverMessage = data.details || data.error || 'Failed to send message. Please try again.';
        throw new Error(serverMessage);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response ?? '',
        timestamp: new Date(),
        sources: data.sources ?? [],
        audioUrl: data.audioUrl,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update user data if provided
      if (data.userData) {
        setUserData(data.userData);
      }

      if (settings.voiceOutput && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }

      // Save conversation history
      if (token) {
        try {
          await fetch('/api/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              action: 'save',
              messages: [...messages, userMessage, assistantMessage],
            }),
          });
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t.errorSending;
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.errorMic,
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio }),
          });

          if (!response.ok) throw new Error('Transcription failed');

          const data = await response.json();
          setInput(data.text);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: t.errorTranscribe,
          });
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') { mediaRecorder.stop(); setIsRecording(false); } }, 10000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.errorMicPerm,
      });
      setIsRecording(false);
    }
  };

  const handleAddWebSource = async () => {
    if (!user || user.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only admins can add knowledge sources',
      });
      return;
    }

    if (!newWebUrl.trim() || isAddingSource) return;

    setIsAddingSource(true);

    try {
      const response = await fetch('/api/knowledge/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newWebUrl }),
      });

      if (!response.ok) throw new Error('Failed to add web source');

      const data = await response.json();

      setKnowledgeSources(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'web',
          name: data.title || newWebUrl,
          url: newWebUrl,
          content: data.content,
          enabled: true,
          addedAt: new Date(),
        },
      ]);

      setNewWebUrl('');
      toast({
        title: 'Success',
        description: t.sourceAdded,
      });
    } catch (error) {
      console.error('Error adding web source:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.errorWebSource,
      });
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleDeleteSource = (id: string) => {
    if (!user || user.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only admins can delete knowledge sources',
      });
      return;
    }

    setKnowledgeSources(prev => prev.filter(s => s.id !== id));
    toast({
      title: 'Success',
      description: t.sourceRemoved,
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: user
          ? (user.role === 'admin' ? t.welcomeAdmin : t.welcomeUser(user.username))
          : t.welcome + ' ' + t.welcome2,
        timestamp: new Date(),
        sources: [],
      },
    ]);
    toast({
      title: 'Success',
      description: t.chatCleared,
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Success',
      description: t.copiedMessage,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sourceCount = knowledgeSources.length + aderaKnowledge.length;

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh sm:min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - deep blue */}
      <header data-header-nav className="flex-shrink-0 border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-sm sticky top-0 z-50 shadow-lg text-primary-foreground">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-md ring-1 ring-white/30 flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white drop-shadow-sm truncate">
                  {t.title}
                </h1>
                <p className="text-xs sm:text-sm text-white/80 truncate">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 [&_button]:!text-white [&_button]:!border-white/60 [&_button]:!bg-white/10 [&_button:hover]:!bg-white/25 [&_button:hover]:!text-white [&_button_svg]:!text-white [&_button_svg]:!opacity-100">
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserData}
                  title={t.myData}
                  className="shadow-sm"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {t.myData}
                </Button>
              )}

              <Button
                variant={settings.voiceOutput ? 'default' : 'outline'}
                size="icon"
                onClick={() => setSettings(prev => ({ ...prev, voiceOutput: !prev.voiceOutput }))}
                title={settings.voiceOutput ? t.disableVoice : t.enableVoice}
                className={`shadow-sm ${settings.voiceOutput ? '!bg-white/30 hover:!bg-white/40 !text-white !border-white/60' : ''}`}
              >
                {settings.voiceOutput ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>

              <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogTrigger asChild>
                  {user ? (
                    <Button variant="outline" size="icon" onClick={handleLogout} className="shadow-sm">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="icon" className="shadow-sm">
                      <LogIn className="w-5 h-5" />
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.login}</DialogTitle>
                    <DialogDescription>
                      {user ? 'Logout from your account' : 'Login to access your personal data'}
                    </DialogDescription>
                  </DialogHeader>
                  {!user ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">{t.username}</Label>
                        <Input
                          id="username"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">{t.password}</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="Enter password"
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                      </div>
                      <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full">
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t.sending}
                          </>
                        ) : (
                          t.login
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleLogout} variant="destructive" className="w-full">
                      {t.logout}
                    </Button>
                  )}
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" title={t.knowledgeBase} className="shadow-sm [&_svg]:!text-white">
                    <Database className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>{t.knowledgeBase}</SheetTitle>
                    <SheetDescription>
                      {user && user.role === 'admin' ? t.manageKnowledge : t.viewKnowledge}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{t.sources}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sourceCount} {sourceCount > 0 ? `(${sourceCount})` : ''}
                        </p>
                      </div>
                      {user && user.role === 'admin' && (
                        <Button size="sm" onClick={loadAderaKnowledge} disabled={isLoadingKnowledge}>
                          {isLoadingKnowledge ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {knowledgeSources.map(source => (
                        <Card key={source.id} className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {source.type === 'database' && <Database className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />}
                              {source.type === 'pdf' && <FileText className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />}
                              {source.type === 'web' && <Globe className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{source.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Switch
                                checked={source.enabled}
                                onCheckedChange={() => toggleKnowledgeSource(source.id)}
                                disabled={!user || user.role === 'admin' ? false : false}
                              />
                              {user && user.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSource(source.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}

                      {aderaKnowledge.map(source => (
                        <Card key={source.id} className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Globe className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{source.name}</p>
                              </div>
                            </div>
                            <Switch
                              checked={source.enabled}
                              onCheckedChange={() => {
                                setAderaKnowledge(prev =>
                                  prev.map(s => s.id === source.id ? { ...s, enabled: !s.enabled } : s)
                                );
                              }}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {user && user.role === 'admin' && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="font-semibold">{t.addWebSource}</h3>
                          <div className="flex gap-2">
                            <Input
                              placeholder="https://..."
                              value={newWebUrl}
                              onChange={(e) => setNewWebUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddWebSource()}
                            />
                            <Button onClick={handleAddWebSource} disabled={isAddingSource} size="icon">
                              {isAddingSource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title={t.settings} className="shadow-sm [&_svg]:!text-white">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t.settings}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center justify-between" as="div">
                    <span className="flex-1">{t.voiceInput}</span>
                    <Switch
                      checked={settings.voiceInput}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voiceInput: checked }))}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between" as="div">
                    <span className="flex-1">{t.autoScroll}</span>
                    <Switch
                      checked={settings.autoScroll}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoScroll: checked }))}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between" as="div">
                    <span className="flex-1">{t.showSources}</span>
                    <Switch
                      checked={settings.showSources}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showSources: checked }))}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleClearChat}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t.clearChat}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* User info bar */}
          {user && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-white/25 text-white border-white/40' : 'bg-white/15 text-white border-white/30'}>
                {user.role === 'admin' ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    {t.admin}
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    {t[user.role as keyof typeof t] || t.customer}
                  </>
                )}
              </Badge>
              <span className="text-white/90">
                {user.username}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* User Data Panel */}
      {showUserData && userData && (
        <div className="border-b bg-background/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                {userData.role === 'admin' ? 'Admin: Database records' : t.myData}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowUserData(false)}>
                <Sparkles className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>

            {userData.role === 'admin' ? (
              <div className="space-y-4 text-sm">
                {userData.users && userData.users.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Users ({userData.users.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {userData.users.slice(0, 15).map((u: any, idx: number) => (
                        <Card key={idx} className="p-2 text-xs">
                          <span className="font-medium">{u.email}</span>
                          <span className="text-muted-foreground ml-2">· {u.role || 'n/a'}</span>
                        </Card>
                      ))}
                      {userData.users.length > 15 && <p className="text-muted-foreground text-xs">+{userData.users.length - 15} more</p>}
                    </div>
                  </div>
                )}
                {userData.deliveries && userData.deliveries.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t.deliveries} ({userData.deliveries.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {userData.deliveries.slice(0, 10).map((d: any, idx: number) => (
                        <Card key={idx} className="p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{d.order_number || 'N/A'}</span>
                            <Badge variant="outline" className="text-[10px]">{d.status || 'Unknown'}</Badge>
                          </div>
                        </Card>
                      ))}
                      {userData.deliveries.length > 10 && <p className="text-muted-foreground text-xs">+{userData.deliveries.length - 10} more</p>}
                    </div>
                  </div>
                )}
                {userData.products && userData.products.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Products ({userData.products.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {userData.products.slice(0, 8).map((p: any, idx: number) => (
                        <Card key={idx} className="p-2 text-xs">
                          {p.name} · {p.category || 'n/a'} · {p.in_stock ? 'In stock' : 'Out'}
                        </Card>
                      ))}
                      {userData.products.length > 8 && <p className="text-muted-foreground text-xs">+{userData.products.length - 8} more</p>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {userData.user && (
                  <div className="text-sm space-y-1">
                    <p><strong>Email:</strong> {userData.user.email}</p>
                  </div>
                )}
                {userData.deliveries && userData.deliveries.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2">{t.deliveries} ({userData.deliveries.length})</h4>
                    <div className="space-y-2">
                      {userData.deliveries.slice(0, 5).map((delivery: any, idx: number) => (
                        <Card key={idx} className="p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{delivery.order_number || 'N/A'}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {delivery.status || 'Unknown'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content – flex layout so input stays visible on mobile */}
      <main className="flex-1 min-h-0 flex flex-col container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {/* Messages – scrollable, takes remaining space */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden rounded-lg border bg-background/50" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}

                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground shadow-md' : message.role === 'system' ? 'bg-muted' : 'bg-muted/90'}`}>
                    {message.image && (
                      <div className="mb-2">
                        <img src={message.image} alt="Uploaded" className="max-w-full h-auto rounded-lg" />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                    {settings.showSources && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {t.sources}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{source}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopyMessage(message.content)} className="h-6 w-6">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/90 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{t.sending}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Image Preview */}
          {imagePreview && (
            <div className="flex-shrink-0">
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedImage?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedImage!.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveImage}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Input Area – always visible, not overlapped by footer */}
          <div className="flex items-end gap-2 flex-shrink-0 pb-4 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title={t.uploadImage}
              className="shadow-sm flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <Textarea
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[48px] max-h-[120px] resize-none shadow-sm"
              disabled={isLoading}
            />

            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isLoading || !settings.voiceInput}
              title={isRecording ? t.stopRecording : t.startRecording}
              className="shadow-sm flex-shrink-0"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="shadow-md flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer – shrink-0 so it doesn't steal space from chat */}
      <footer className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-xs text-muted-foreground">
            <span>{t.poweredBy}</span>
            <span>© 2026 Adera-Hybrid-App</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
