export default function RootLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-20 w-20 animate-bounce">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full animate-spin [animation-duration:2s]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="ballGrad" cx="40%" cy="35%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0e0e0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#ballGrad)" stroke="#888" strokeWidth="1" />
            <path d="M50 2 A48 48 0 0 1 98 50" fill="none" stroke="#333" strokeWidth="1.2" />
            <path d="M50 2 A48 48 0 0 0 2 50" fill="none" stroke="#333" strokeWidth="1.2" />
            <path d="M50 98 A48 48 0 0 1 2 50" fill="none" stroke="#333" strokeWidth="1.2" />
            <path d="M50 98 A48 48 0 0 0 98 50" fill="none" stroke="#333" strokeWidth="1.2" />
            <path d="M2 50 A48 48 0 0 0 50 98" fill="none" stroke="#333" strokeWidth="1.2" />
            <path d="M98 50 A48 48 0 0 0 50 2" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="50,6 68,22 62,42 38,42 32,22" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="76,28 94,44 86,66 66,58 62,38" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="24,28 38,38 34,58 14,66 6,44" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="40,50 60,50 66,72 50,86 34,72" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="70,62 84,78 74,94 56,90 56,72" fill="none" stroke="#333" strokeWidth="1.2" />
            <polygon points="30,62 44,72 44,90 26,94 16,78" fill="none" stroke="#333" strokeWidth="1.2" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
