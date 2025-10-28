import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface AddContactDialogProps {
  userId: number;
  onContactAdded: () => void;
}

interface FoundUser {
  id: number;
  phone: string;
  name: string;
  status: string;
  online: boolean;
}

const AddContactDialog = ({ userId, onContactAdded }: AddContactDialogProps) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [error, setError] = useState('');

  const searchUser = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://functions.poehali.dev/ae0dcc8e-4b3f-465c-b5b8-d4c7aa3f99c7?action=search&phone=${encodeURIComponent(phone)}`,
        {
          headers: {
            'X-User-Id': userId.toString(),
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFoundUser(data);
      } else {
        setError(data.error || 'Пользователь не найден');
        setFoundUser(null);
      }
    } catch (err) {
      setError('Ошибка поиска');
      setFoundUser(null);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!foundUser) return;

    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ae0dcc8e-4b3f-465c-b5b8-d4c7aa3f99c7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({ contact_id: foundUser.id }),
      });

      if (response.ok) {
        setOpen(false);
        setPhone('');
        setFoundUser(null);
        onContactAdded();
      } else {
        setError('Не удалось добавить контакт');
      }
    } catch (err) {
      setError('Ошибка добавления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Icon name="UserPlus" size={24} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить контакт</DialogTitle>
          <DialogDescription>
            Введите номер телефона пользователя, которого хотите добавить
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="+7 (900) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
            />
            <Button onClick={searchUser} disabled={loading}>
              {loading ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="Search" size={20} />}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          {foundUser && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {foundUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{foundUser.name}</div>
                  <div className="text-sm text-muted-foreground">{foundUser.phone}</div>
                </div>
                {foundUser.online && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </div>
              
              <Button onClick={addContact} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Добавление...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={20} className="mr-2" />
                    Добавить в контакты
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactDialog;
