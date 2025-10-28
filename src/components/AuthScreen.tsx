import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  phone: string;
  name: string;
  status: string;
  online: boolean;
}

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/aab3c329-fa1b-4ec3-b59a-6450ce7c1dd2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, name }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        onLogin(data);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
            <Icon name="MessageSquare" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Сообщение</CardTitle>
          <CardDescription className="text-base">
            Войдите по номеру телефона для начала общения
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Номер телефона</label>
              <Input
                type="tel"
                placeholder="+7 (900) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя (необязательно)</label>
              <Input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="text-base"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-base h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Нажимая "Войти", вы соглашаетесь с условиями использования</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthScreen;
