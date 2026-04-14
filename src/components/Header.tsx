import { User } from 'firebase/auth';

interface HeaderProps {
  totalCount: number;
  user: User | null;
  onLogin: () => void;
}

export default function Header({ totalCount, user, onLogin }: HeaderProps) {
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <header className="h-14 bg-bg-deep/95 backdrop-blur-md border-b border-border-halloween flex items-center px-4 gap-3 z-[900]">
      <div className="text-2xl">🎃</div>
      <div className="font-serif text-lg font-bold text-amber-halloween flex-1">
        Halloween Night Watch
      </div>
      <div className="hidden sm:block text-[10px] font-bold text-muted-halloween whitespace-nowrap">
        {dateStr} • Halloween Night
      </div>
      <div className="flex items-center gap-1 bg-bg-card border border-border-halloween rounded-full px-3 py-1 text-[11px] font-bold text-warm-halloween">
        🔦 <span className="text-orange-halloween text-sm">{totalCount}</span> tonight
      </div>
      
      {user ? (
        <div className="flex items-center gap-2 ml-2">
          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-orange-halloween" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <button 
          onClick={onLogin}
          className="ml-2 px-3 py-1 bg-orange-halloween text-bg-deep font-bold text-xs rounded-full hover:bg-amber-halloween transition-colors"
        >
          Login
        </button>
      )}
    </header>
  );
}
