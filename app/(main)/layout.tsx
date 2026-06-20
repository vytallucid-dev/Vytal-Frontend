import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* static grid backdrop (depth from surfaces + hairline grid, no motion) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-grid opacity-30 mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-transparent">
        <div className="flex h-svh min-w-0 flex-col">
          <Navbar />
          <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-10 pt-4 sm:px-5 lg:px-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
