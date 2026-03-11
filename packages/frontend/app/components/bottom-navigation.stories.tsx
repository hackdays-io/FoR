import { Gift, QrCode, Scan, Send } from "lucide-react";
import type * as React from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  type To,
  useLocation,
} from "react-router";

import "~/app.css";
import {
  BottomNavigation,
  BottomNavigationItem,
} from "~/components/ui/bottom-navigation";

export default {
  title: "Components/BottomNavigation",
};

type StoryFrameProps = {
  children: React.ReactNode;
  initialEntry?: string;
};

function StoryFrame({ children, initialEntry = "/send" }: StoryFrameProps) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="*" element={<StoryContent>{children}</StoryContent>} />
      </Routes>
    </MemoryRouter>
  );
}

function StoryContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="relative min-h-screen bg-background">
      <div className="p-24">
        <p className="text-ui-13 text-muted-foreground">
          現在のパス: {location.pathname}
        </p>
      </div>
      {children}
    </div>
  );
}

const ICON_SIZE = 20;

type NavItem = {
  icon: React.ReactNode;
  label: string;
  to: To;
};

const navItems: NavItem[] = [
  { icon: <Send size={ICON_SIZE} />, label: "送る", to: "/send" },
  { icon: <Scan size={ICON_SIZE} />, label: "スキャン", to: "/scan" },
  { icon: <QrCode size={ICON_SIZE} />, label: "マイコード", to: "/mycode" },
  { icon: <Gift size={ICON_SIZE} />, label: "出品", to: "/listing" },
];

export const Default = () => {
  return (
    <StoryFrame initialEntry="/send">
      <BottomNavigation>
        {navItems.map((item) => (
          <BottomNavigationItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </BottomNavigation>
    </StoryFrame>
  );
};

Default.storyName = "Default (1st Active)";

export const ThirdActive = () => {
  return (
    <StoryFrame initialEntry="/mycode">
      <BottomNavigation>
        {navItems.map((item) => (
          <BottomNavigationItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </BottomNavigation>
    </StoryFrame>
  );
};

ThirdActive.storyName = "3rd Item Active";

export const WithDisabled = () => {
  return (
    <StoryFrame initialEntry="/send">
      <BottomNavigation>
        {navItems.map((item, i) => (
          <BottomNavigationItem
            key={item.label}
            disabled={i === 3}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </BottomNavigation>
    </StoryFrame>
  );
};

WithDisabled.storyName = "With Disabled Item";
