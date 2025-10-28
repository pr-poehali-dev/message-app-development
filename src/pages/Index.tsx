import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import AuthScreen from '@/components/AuthScreen';

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
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

interface Contact {
  id: number;
  name: string;
  status: string;
  online?: boolean;
}

interface Message {
  id: number;
  text: string;
  time: string;
  sender: 'me' | 'other';
}

const mockChats: Chat[] = [
  { id: 1, name: 'Команда дизайна', lastMessage: 'Посмотрите новые макеты', time: '14:32', unread: 3, online: true },
  { id: 2, name: 'Алексей Иванов', lastMessage: 'Созвон завтра в 10?', time: '13:15', unread: 1, online: true },
  { id: 3, name: 'Проект "Старт"', lastMessage: 'Обсудим бюджет', time: '11:40', online: false },
  { id: 4, name: 'Мария Петрова', lastMessage: 'Отправила документы', time: 'Вчера', online: false },
];

const mockContacts: Contact[] = [
  { id: 1, name: 'Алексей Иванов', status: 'Руководитель отдела', online: true },
  { id: 2, name: 'Мария Петрова', status: 'Дизайнер', online: false },
  { id: 3, name: 'Дмитрий Смирнов', status: 'Разработчик', online: true },
  { id: 4, name: 'Елена Волкова', status: 'Маркетолог', online: true },
];

const mockMessages: Message[] = [
  { id: 1, text: 'Привет! Как дела с проектом?', time: '14:28', sender: 'other' },
  { id: 2, text: 'Всё отлично, завтра выкатываем', time: '14:29', sender: 'me' },
  { id: 3, text: 'Отлично! Жду макеты', time: '14:30', sender: 'other' },
  { id: 4, text: 'Посмотрите новые макеты', time: '14:32', sender: 'other' },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        text: newMessage,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        sender: 'me'
      }]);
      setNewMessage('');
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
          <h2 className="text-xl font-semibold mb-3">
            {activeTab === 'chats' && 'Чаты'}
            {activeTab === 'contacts' && 'Контакты'}
            {activeTab === 'calls' && 'Звонки'}
          </h2>
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {activeTab === 'chats' && mockChats.map((chat) => (
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
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unread && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">{chat.unread}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'contacts' && mockContacts.map((contact) => (
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icon name="MessageSquare" size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.online ? 'В сети' : 'Не в сети'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Icon name="Phone" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Video" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="MoreVertical" size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className={`text-xs mt-1 block ${message.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default Index;