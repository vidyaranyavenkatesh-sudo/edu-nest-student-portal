'use client'
import { Alert, Badge, Button, Card, Empty, Loading, PageHead } from '@/components/ui'
import { useMe } from '@/lib/profile'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { addDays, fmtDate, fmtSize, q, todayISO } from '@/lib/util'
import { openFile } from '@/lib/files'
import { toastError } from '@/lib/toast'

export default function MissedNotes() {
  const { school } = useMe()
  const sb = supabaseBrowser()
  const today = todayISO(school.timezone)
  const data = useAsync(async () => {
    const abs = await q<any[]>(sb.from('attendance').select('date').eq('status', 'absent').gte('date', addDays(today, -90)).order('date', { ascending: false }))
    const dates = Array.from(new Set(abs.map((a) => a.date)))
    if (!dates.length) return { dates, notes: [] as any[] }
    const notes = await q<any[]>(sb.from('daily_notes').select('id,title,body,note_date,subject:subjects(name),note_files(id,file_name,storage_path,size_bytes)').in('note_date', dates).order('created_at'))
    return { dates, notes }
  }, [])
  return (
    <>
      <PageHead title="Missed classes" sub="Notes from every day you were marked absent (last 90 days). They appear here as soon as your teachers post them." />
      <Loading loading={data.loading} error={data.error} hasData={!!data.data}>
        {data.data?.dates.length === 0 && <Card><Empty>You have not been absent in the last 90 days. 🎉</Empty></Card>}
        {(data.data?.dates || []).map((date) => {
          const notes = data.data!.notes.filter((n) => n.note_date === date)
          return (
            <Card key={date} title={fmtDate(date)} actions={<Badge kind="bad">Absent</Badge>}>
              {notes.length === 0 && <Alert kind="warn">Your teachers have not posted notes for this day yet. Check again later, or ask a classmate.</Alert>}
              {notes.map((n) => (
                <div key={n.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <div className="row"><Badge kind="accent">{n.subject?.name}</Badge><b>{n.title}</b></div>
                  {n.body && <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>{n.body}</p>}
                  <div className="row">
                    {n.note_files.map((f: any) => <Button key={f.id} small onClick={() => openFile('notes', f.storage_path).catch(toastError)}>📎 {f.file_name} <span className="muted">{fmtSize(f.size_bytes)}</span></Button>)}
                  </div>
                </div>
              ))}
            </Card>
          )
        })}
      </Loading>
    </>
  )
}
