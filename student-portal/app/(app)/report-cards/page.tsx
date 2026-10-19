'use client'
import Link from 'next/link'
import { Badge, Card, Empty, Loading, PageHead } from '@/components/ui'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { fmtDate, q } from '@/lib/util'

export default function ReportCards() {
  const sb = supabaseBrowser()
  const data = useAsync<any[]>(() => q(sb.from('report_cards').select('id,term,version,published_at,snapshot').order('published_at', { ascending: false })), [])
  return (
    <>
      <PageHead title="Report cards" sub="Published by the school. Open one to view, print or save as PDF." />
      <Loading loading={data.loading} error={data.error} hasData={!!data.data}>
        {data.data?.length === 0 && <Card><Empty>No report cards have been published yet.</Empty></Card>}
        <div className="grid c2">
          {(data.data || []).map((r) => (
            <Card key={r.id} title={`${r.term}`}>
              <p className="muted">Academic year {r.snapshot?.year} · published {fmtDate(String(r.published_at).slice(0, 10))} {r.version > 1 && <Badge kind="warn">corrected copy</Badge>}</p>
              <p style={{ fontSize: '1.4rem', margin: '0 0 10px' }}><b>{r.snapshot?.overall?.percent ?? '–'}%</b> <span className="muted">· grade</span> <b>{r.snapshot?.overall?.grade ?? '–'}</b></p>
              <Link className="btn primary" href={`/report-cards/${r.id}`}>Open report card</Link>
            </Card>
          ))}
        </div>
      </Loading>
    </>
  )
}
