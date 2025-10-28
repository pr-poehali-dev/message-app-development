import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import AuthScreen from '@/components/AuthScreen';
import AddContactDialog from '@/components/AddContactDialog';
import CallScreen from '@/components/CallScreen';

type Tab = 'chats' | 'contacts' | 'calls';

interface User {
  id: number;
  phone: string;
  name: string;
  status: string;
  online: boolean;
}

interface Chat {
  id: number;
  name: string;
  last_message: string;
  time: string;
  is_group?: boolean;
}

interface Contact {
  id: number;
  phone: string;
  name: string;
  status: string;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  time: string;
  sender_id: number;
  sender_name?: string;
}



const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callContact, setCallContact] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'contacts') {
        loadContacts();
      } else if (activeTab === 'chats') {
        loadChats();
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const loadContacts = async () => {
    if (!user) return;

    setLoadingContacts(true);
    try {
      const response = await fetch('https://functions.poehali.dev/ae0dcc8e-4b3f-465c-b5b8-d4c7aa3f99c7', {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadChats = async () => {
    if (!user) return;

    setLoadingChats(true);
    try {
      const response = await fetch('https://functions.poehali.dev/9bdb98be-11ce-4edb-a1df-ccae98a3d0d8', {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Failed to load chats', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/9bdb98be-11ce-4edb-a1df-ccae98a3d0d8?action=messages&chat_id=${chatId}`, {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const startChat = async (contactId: number) => {
    if (!user) return;

    try {
      const response = await fetch('https://functions.poehali.dev/9bdb98be-11ce-4edb-a1df-ccae98a3d0d8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({ action: 'create', contact_id: contactId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveTab('chats');
        await loadChats();
        const newChat = chats.find(c => c.id === data.chat_id);
        if (newChat) {
          setSelectedChat(newChat);
        }
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await fetch('https://functions.poehali.dev/9bdb98be-11ce-4edb-a1df-ccae98a3d0d8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({ 
          action: 'send', 
          chat_id: selectedChat.id, 
          text: messageText 
        }),
      });

      if (response.ok) {
        await loadMessages(selectedChat.id);
        await loadChats();
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(messageText);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-20 bg-sidebar flex flex-col items-center py-6 gap-6">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
          С
        </div>
        
        <nav className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 ${activeTab === 'chats' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
            onClick={() => setActiveTab('chats')}
          >
            <Icon name="MessageSquare" size={24} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 ${activeTab === 'contacts' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
            onClick={() => setActiveTab('contacts')}
          >
            <Icon name="Users" size={24} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 ${activeTab === 'calls' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
            onClick={() => setActiveTab('calls')}
          >
            <Icon name="Phone" size={24} />
          </Button>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className="relative group">
            <Avatar className="w-12 h-12 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
            title="Выйти"
          >
            <Icon name="LogOut" size={24} />
          </Button>
        </div>
      </aside>

      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">
              {activeTab === 'chats' && 'Чаты'}
              {activeTab === 'contacts' && 'Контакты'}
              {activeTab === 'calls' && 'Звонки'}
            </h2>
            {activeTab === 'contacts' && user && (
              <AddContactDialog userId={user.id} onContactAdded={loadContacts} />
            )}
          </div>
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {activeTab === 'chats' && loadingChats && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="Loader2" size={48} className="mx-auto mb-3 opacity-50 animate-spin" />
              <p>Загрузка чатов...</p>
            </div>
          )}

          {activeTab === 'chats' && !loadingChats && chats.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет чатов</p>
              <p className="text-sm mt-2">Начните общение с контактом</p>
            </div>
          )}

          {activeTab === 'chats' && !loadingChats && chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${selectedChat?.id === chat.id ? 'bg-accent' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{chat.name || 'Чат'}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{chat.last_message || 'Нет сообщений'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'contacts' && loadingContacts && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="Loader2" size={48} className="mx-auto mb-3 opacity-50 animate-spin" />
              <p>Загрузка контактов...</p>
            </div>
          )}

          {activeTab === 'contacts' && !loadingContacts && contacts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет контактов</p>
              <p className="text-sm mt-2">Добавьте первый контакт</p>
            </div>
          )}

          {activeTab === 'contacts' && !loadingContacts && contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.status}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => startChat(contact.id)}
                  >
                    <Icon name="MessageSquare" size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      setCallContact(contact.name);
                      setIsInCall(true);
                    }}
                  >
                    <Icon name="Phone" size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'calls' && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="Phone" size={48} className="mx-auto mb-3 opacity-50" />
              <p>История звонков пока пуста</p>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat && activeTab === 'chats' ? (
          <>
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.name || 'Чат'}</h3>
                  <p className="text-sm text-muted-foreground">В сети</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setCallContact(selectedChat.name);
                    setIsInCall(true);
                  }}
                >
                  <Icon name="Phone" size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setCallContact(selectedChat.name);
                    setIsInCall(true);
                  }}
                >
                  <Icon name="Video" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="MoreVertical" size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-8">
                      <p>Нет сообщений</p>
                      <p className="text-sm mt-2">Начните общение</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p>{message.text}</p>
                          <span className={`text-xs mt-1 block ${message.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {message.time}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageSquare" size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </div>

      {isInCall && callContact && (
        <CallScreen 
          contactName={callContact} 
          onEndCall={() => {
            setIsInCall(false);
            setCallContact(null);
          }} 
        />
      )}
    </div>
  );
};

export default Index;