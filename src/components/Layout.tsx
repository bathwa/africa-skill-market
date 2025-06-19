
import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png" 
                  alt="SkillZone Logo" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">SkillZone</span>
              </div>
              <p className="text-gray-400">
                Connecting skilled workers with opportunities across SADC countries.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Support (Zimbabwe)</h3>
              <div className="space-y-2 text-gray-400">
                <p>Phone: +263 78 998 9619</p>
                <p>Email: admin@abathwa.com</p>
                <p>WhatsApp: wa.me/789989619</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Countries Served</h3>
              <div className="text-gray-400 text-sm">
                Zimbabwe, South Africa, Botswana, Zambia, Namibia, Angola, Mozambique, Malawi
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SkillZone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
