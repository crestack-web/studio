export function DashboardPreview() {
  return (
    <div className="dashboard-preview grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-6 mb-20">
      <div className="dash-card bg-purple-600 text-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col items-start">
        <div className="dash-card-icon bg-white/20 rounded-full p-3 mb-2 text-2xl flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#162334"></circle>
            <circle cx="40" cy="40" r="36" fill="none" stroke="#1DB954" stroke-width="1.5"></circle>
            <circle cx="40" cy="37" r="21" fill="#F5C9A0"></circle>
            <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"></path>
            <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
            <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
            <circle cx="32.5" cy="34.5" r="1.5" fill="white"></circle>
            <circle cx="50.5" cy="34.5" r="1.5" fill="white"></circle>
            <path d="M30 43 Q40 50 50 43" stroke="#CC7A3A" stroke-width="2" stroke-linecap="round" fill="none"></path>
            <ellipse cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
            <ellipse cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
            <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"></ellipse>
            <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"></rect>
            <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"></polygon>
          </svg>
        </div>
        <div className="dash-card-label text-xs font-semibold mb-1">Ask Busmo AI</div>
        <div className="ask-bubble bg-white/10 rounded px-3 py-2 mb-1 text-sm">"Did I make profit today?"</div>
        <div className="ask-answer bg-white/20 rounded px-3 py-2 text-xs">✅ Yes! Your net profit today is <strong>₦13,000</strong> — Margin: 29%</div>
      </div>
      <div className="dash-card bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col items-start">
        <div className="dash-card-icon bg-purple-100 rounded-full p-3 mb-2 text-2xl flex items-center justify-center">📊</div>
        <div className="dash-card-label text-xs font-semibold mb-1">Business Health</div>
        <div className="dash-card-value text-2xl font-bold mb-1">₦45,000</div>
        <div className="dash-card-sub text-xs mb-1">Today's Sales</div>
        <span className="dash-card-badge bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">↑ Profit: ₦13,000</span>
      </div>
      <div className="dash-card bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col items-start">
        <div className="dash-card-icon bg-yellow-100 rounded-full p-3 mb-2 text-2xl flex items-center justify-center">🔮</div>
        <div className="dash-card-label text-xs font-semibold mb-1">AI Forecast</div>
        <div className="dash-card-value text-2xl font-bold mb-1">~₦91K</div>
        <div className="dash-card-sub text-xs mb-1">Next Week's Profit</div>
        <span className="dash-card-badge bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Busiest: Saturday</span>
      </div>
      <div className="dash-card bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col items-start">
        <div className="dash-card-icon bg-blue-100 rounded-full p-3 mb-2 text-2xl flex items-center justify-center">💡</div>
        <div className="dash-card-label text-xs font-semibold mb-1">Today's Top Insight</div>
        <div className="dash-card-value text-sm font-medium mb-1">Bottled Water may run out in 3 days. Restock soon.</div>
        <span className="dash-card-badge bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Stock Alert</span>
      </div>
      <div className="dash-card bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col items-start">
        <div className="dash-card-icon bg-green-100 rounded-full p-3 mb-2 text-2xl flex items-center justify-center">💰</div>
        <div className="dash-card-label text-xs font-semibold mb-1">Cash Balance</div>
        <div className="dash-card-value text-2xl font-bold mb-1">₦150,000</div>
        <div className="dash-card-sub text-xs mb-1">Cash Runway: ~45 days</div>
        <span className="dash-card-badge bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Healthy</span>
      </div>
    </div>
  );
}