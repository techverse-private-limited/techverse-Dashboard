import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function AdminLayout({ children, noPadding = false }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col pl-4">
          <header className="sticky top-0 z-10 flex h-auto min-h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-6 py-3 shrink-0">
            <SidebarTrigger />
          </header>
          <main className={`flex-1 flex flex-col overflow-hidden ${noPadding ? "" : "p-4 sm:p-6 lg:p-8"}`}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
