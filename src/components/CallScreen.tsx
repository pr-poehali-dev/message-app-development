import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface CallScreenProps {
  contactName: string;
  onEndCall: () => void;
}

const CallScreen = ({ contactName, onEndCall }: CallScreenProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 to-background flex flex-col items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32">
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
              {contactName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-3xl font-bold mb-2">{contactName}</h2>
            <p className="text-lg text-muted-foreground">{formatDuration(callDuration)}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            size="icon"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="w-16 h-16 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
          </Button>

          <Button
            size="icon"
            variant="destructive"
            className="w-20 h-20 rounded-full"
            onClick={onEndCall}
          >
            <Icon name="PhoneOff" size={28} />
          </Button>

          <Button
            size="icon"
            variant={isVideoOn ? 'secondary' : 'destructive'}
            className="w-16 h-16 rounded-full"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            <Icon name={isVideoOn ? 'Video' : 'VideoOff'} size={24} />
          </Button>
        </div>
      </div>

      {isVideoOn && (
        <div className="absolute top-4 right-4 w-48 h-36 bg-muted rounded-lg border-2 border-border flex items-center justify-center">
          <Icon name="User" size={48} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default CallScreen;
