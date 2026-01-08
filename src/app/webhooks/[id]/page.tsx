import { WebhookDetails } from '@/components/webhook-details'
import { Suspense } from 'react'

export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <WebhookDetails id={id} />
    </Suspense>
  )
}
