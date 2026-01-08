import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Sidebar } from '@/components/sidebar'
import { Providers } from '@/components/providers'
import '@/styles/globals.css'

export const metadata = {
  title: 'Webhook Inspector',
  description: 'Capture and inspect webhook requests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="h-screen bg-zinc-900">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={20} minSize={15} maxSize={40}>
                <Sidebar />
              </Panel>

              <PanelResizeHandle className="w-px bg-zinc-700 hover:bg-zinc-600 transition-colors duration-150" />

              <Panel defaultSize={80} minSize={60}>
                {children}
              </Panel>
            </PanelGroup>
          </div>
        </Providers>
      </body>
    </html>
  )
}
