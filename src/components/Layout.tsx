
import { ReactNode } from 'react';
import Header from './Header';
import { ThemeProvider } from './ui/theme-provider';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

const Layout = ({ children, showHeader = true }: LayoutProps) => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="skillzone-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        {showHeader && <Header />}
        <main className={showHeader ? "pt-0" : ""}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
