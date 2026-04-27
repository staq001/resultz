type TopNavProps = {
  onHome: () => void;
  onLogin: () => void;
  onSignup: () => void;
};

export function TopNav({ onHome, onLogin, onSignup }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="brand-pill">
        <img src="/lasu-logo.png" alt="LASU logo" className="brand-logo" />
      </div>
      <nav>
        <button type="button" className="ghost" onClick={onHome}>
          Home
        </button>
        <button type="button" className="ghost" onClick={onLogin}>
          Login
        </button>
        <button type="button" className="ghost" onClick={onSignup}>
          Sign Up
        </button>
      </nav>
    </header>
  );
}
