import { Button } from "./Button";
import { CreditCard, Truck, RefreshCw, Globe, Zap } from 'lucide-react';

export function Market() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold uppercase text-purple-700 mb-2">Busmo Market</div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
              Sell Online.<br /><em className="not-italic text-purple-700">Insights Sync Instantly.</em>
            </h2>
            <p className="text-gray-600 mb-6">
              List your products on Busmo Market and turn every sale into an instant business insight. Your sales feed your dashboard automatically.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-700" /> List products in seconds, right from your dashboard.</li>
              <li className="flex items-center gap-2"><Globe className="w-5 h-5 text-purple-700" /> Reach new customers searching for products like yours.</li>
              <li className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-purple-700" /> Every sale automatically updates inventory, sales & profit.</li>
              <li className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-700" /> BusmoPay handles checkout and payouts seamlessly.</li>
              <li className="flex items-center gap-2"><Truck className="w-5 h-5 text-purple-700" /> BusmoGo delivery built into every order.</li>
            </ul>
            <div className="mt-8 flex justify-center">
              <Button as="a" href="#seller" variant="primary">
                Explore Busmo Market &rarr;
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Example product cards */}
            <div className="bg-gray-50 rounded-lg shadow p-3">
              <img src="https://tse1.explicit.bing.net/th/id/OIP.onWQK_EafEvqumapTYMGLgHaLH?w=2558&h=3840&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Handmade Leather Bag" className="rounded mb-2" />
              <div className="font-semibold text-sm">Handmade Leather Bag</div>
              <div className="text-xs text-gray-500">Aisha's Crafts</div>
              <div className="text-purple-700 font-bold text-sm">₦12,000</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-3">
              <img src="https://loveofindia.com/cdn/shop/files/naturalhoney.jpg?v=1736535117&width=550" alt="Organic Honey" className="rounded mb-2" />
              <div className="font-semibold text-sm">Organic Honey (500ml)</div>
              <div className="text-xs text-gray-500">Femi's Farm</div>
              <div className="text-purple-700 font-bold text-sm">₦4,000</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-3">
              <img src="https://image.made-in-china.com/202f0j00OZJqRDdhwuzA/Vibrant-Floral-Print-Lady-Dress-for-Modern-Fashionistas.webp" alt="African Print Dress" className="rounded mb-2" />
              <div className="font-semibold text-sm">African Print Dress</div>
              <div className="text-xs text-gray-500">Ngozi's Boutique</div>
              <div className="text-purple-700 font-bold text-sm">₦15,000</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-3">
              <img src="https://pickar.com.ng/wp-content/uploads/2023/05/1-26.jpg" alt="Bag of Rice" className="rounded mb-2" />
              <div className="font-semibold text-sm">Bag of Rice (50kg)</div>
              <div className="text-xs text-gray-500">Olu's Agro Store</div>
              <div className="text-purple-700 font-bold text-sm">₦32,000</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-3">
              <img src="https://th.bing.com/th?id=OIF.8kF1wKi%2bdrm6qHAdH9yjWA&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Office Chair" className="rounded mb-2" />
              <div className="font-semibold text-sm">Ergonomic Office Chair</div>
              <div className="text-xs text-gray-500">Abuja Furniture Mart</div>
              <div className="text-purple-700 font-bold text-sm">₦25,000</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}