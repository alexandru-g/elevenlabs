import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, User, Phone, Circle, X, Volume2, Mic, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isTraining?: boolean;
  callDuration?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'Training Tip', message: 'Remember to confirm the location early in the call', time: '2m ago', read: false },
  { id: '2', title: 'New Scenario', message: 'Highway Pileup scenario is now available', time: '1h ago', read: false },
  { id: '3', title: 'Weekly Summary', message: 'You completed 5 training sessions this week', time: '1d ago', read: true },
];

export function Header({ isTraining, callDuration }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="h-14 bg-bg-secondary border-b border-white/5 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-cyan flex items-center justify-center">
          <Phone className="w-4 h-4 text-bg-primary" />
        </div>
        <span className="text-lg font-semibold text-text-primary">911 Training Calls</span>
      </div>

      {isTraining && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-bg-tertiary rounded-md border border-white/10">
          <Phone className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm text-text-secondary">TRAINING CALL ACTIVE</span>
          <span className="text-sm font-mono text-text-primary">{callDuration}</span>
          <div className="flex items-center gap-1.5 ml-2">
            <Circle className="w-2 h-2 fill-accent-red text-accent-red live-pulse" />
            <span className="text-xs text-accent-red font-medium">REC</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              setShowSettings(false);
            }}
            className="p-2 rounded hover:bg-bg-hover transition-colors relative"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-bg-secondary border border-white/10 rounded-lg shadow-xl z-50">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <span className="font-medium text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-accent-cyan hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-text-tertiary text-sm">No notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-white/5 hover:bg-bg-hover transition-colors ${!notif.read ? 'bg-accent-cyan/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!notif.read && <div className="w-2 h-2 rounded-full bg-accent-cyan" />}
                            <span className="text-sm font-medium text-text-primary">{notif.title}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">{notif.message}</p>
                          <span className="text-xs text-text-tertiary mt-1">{notif.time}</span>
                        </div>
                        <button
                          onClick={() => clearNotification(notif.id)}
                          className="text-text-tertiary hover:text-text-primary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowSettings(false);
            }}
            className="p-2 rounded hover:bg-bg-hover transition-colors"
          >
            <User className="w-5 h-5 text-text-secondary" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-bg-secondary border border-white/10 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">Trainee</div>
                    <div className="text-xs text-text-tertiary">Dispatcher in Training</div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
                  View Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
                  Training History
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
                  Achievements
                </button>
              </div>
              <div className="p-2 border-t border-white/10">
                <button className="w-full text-left px-3 py-2 text-sm text-accent-red hover:bg-bg-hover rounded transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        <div ref={settingsRef} className="relative">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="p-2 rounded hover:bg-bg-hover transition-colors"
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-12 w-64 bg-bg-secondary border border-white/10 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-white/10">
                <span className="font-medium text-text-primary">Settings</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="w-4 h-4 text-text-secondary" /> : <Sun className="w-4 h-4 text-text-secondary" />}
                    <span className="text-sm text-text-secondary">Dark Mode</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-accent-cyan' : 'bg-bg-tertiary'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white m-1 transition-transform ${darkMode ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">Sound Effects</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-accent-cyan' : 'bg-bg-tertiary'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white m-1 transition-transform ${soundEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">Voice Input</span>
                  </div>
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${micEnabled ? 'bg-accent-cyan' : 'bg-bg-tertiary'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white m-1 transition-transform ${micEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isTraining && (
          <div className="ml-2 flex items-center gap-1.5 px-2 py-1 bg-status-active/20 rounded">
            <Circle className="w-2 h-2 fill-status-active text-status-active live-pulse" />
            <span className="text-xs text-status-active font-medium">LIVE</span>
          </div>
        )}
      </div>
    </header>
  );
}
