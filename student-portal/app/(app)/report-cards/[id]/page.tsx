'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, Empty, Loading } from '@/components/ui'
import ReportCardView from '@/components/ReportCardView'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { q } from '@/lib/util'

export default function ReportCardPage() {
  const { id } = useParams<{ id: string }>()
  const sb = supabaseBrowser()
  const d = useAsync<any>(() => q(sb.from('report_cards').select('id,version,snapshot').eq('id', id).maybeSingle()), [id])
  return (
    <>
      <p className="no-print"><Link href="/report-cards">← All report cards</Link></p>
      <Loading loading={d.loading} error={d.error} hasData={!!d.data || d.data === null}>
        {d.data === null && <Card><Empty>This report card is not available. It may have been replaced by a corrected copy.</Empty></Card>}
        {d.data && <ReportCardView data={d.data.snapshot} version={d.data.version} />}
      </Loading>
    </>
  )
}
