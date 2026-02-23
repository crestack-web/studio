import { XCircle, CheckCircle, BarChart2, User, FileText, WifiOff, Book, Zap, MessageCircle, Lightbulb, Wifi, Rocket } from 'lucide-react';

export function Comparison() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase text-purple-700 mb-2">Why Busmo</div>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
            Not another <em className="not-italic text-purple-700">accounting app.</em>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Busmo is a decision-making tool built for the reality of your business — not for accountants.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow border">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-4">
              <XCircle className="w-6 h-6" /> The Old Way
            </div>
            <div className="font-bold text-lg mb-2">Accounting Software</div>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Endless fields, confusing charts, features you'll never use</li>
              <li className="flex items-center gap-2"><User className="w-4 h-4" /> Built for accountants — speaks "debits" and "credits"</li>
              <li className="flex items-center gap-2"><FileText className="w-4 h-4" /> Gives you long reports to dig through, not answers</li>
              <li className="flex items-center gap-2"><Wifi className="w-4 h-4" /> Requires constant internet connection</li>
              <li className="flex items-center gap-2"><Book className="w-4 h-4" /> Takes weeks to learn before you can use it properly</li>
            </ul>
          </div>
          <div className="bg-purple-700 text-white rounded-2xl p-8 shadow border border-purple-200">
            <div className="flex items-center gap-2 text-white font-bold mb-4">
              <CheckCircle className="w-6 h-6" /> The Busmo Way
            </div>
            <div className="font-bold text-lg mb-2">Clarity Tool</div>
            <ul className="space-y-2 text-white/90 text-sm">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4" /> Record a sale in seconds. See your profit instantly</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Built for owners — speaks your language, gives straight answers</li>
              <li className="flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Your most important insights are always one tap away</li>
              <li className="flex items-center gap-2"><WifiOff className="w-4 h-4" /> Works offline — because your business doesn't pause for WiFi</li>
              <li className="flex items-center gap-2"><Rocket className="w-4 h-4" /> Up and running in minutes, not weeks</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}