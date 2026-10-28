import { HeaderActionsProvider } from "@agent-native/toolkit/app-shell";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * App shell. Pages scroll with the browser window (so route changes, keyboard
 * navigation and scroll restoration behave normally). Page chrome and the
 * single <main> landmark live in `SiteShell`.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <HeaderActionsProvider>
      <div className="agent-native-app-main min-h-screen w-full bg-background text-foreground">
        {children}
      </div>
    </HeaderActionsProvider>
  );
}
