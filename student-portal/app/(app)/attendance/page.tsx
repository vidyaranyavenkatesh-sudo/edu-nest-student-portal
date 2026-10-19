'use client'
import { useState } from 'react'
import { Alert, Bar, Button, Card, Empty, Field, Loading, PageHead, Stat, StatusBadge } from '@/components/ui'
import { useMe, setting } from '@/lib/profile'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAction, useAsync } from '@/lib/hooks'
import { addDays, addMonths, fmtDate, fmtMonth, isoWeekday, monthEnd, monthStart, q, todayISO } from '@/lib/util'

const rank: Record<string, number> = { absent: 4, late: 3, leave: 2, present: 1 }
const cls: Record<string, string> = { absent: 'a', late: 'l', leave: 'v', present: 'p' }

export default function AttendancePage() {
  const { me, school } = useMe()
  const sb = supabaseBrowser()
  const today = todayISO(school.timezone)
  const [month, setMonth] = useState(monthStart(today))
  const low = Number(setting(school, 'low_attendance_threshold', 75))

  const year = useAsync<any>(async () => {
    const y = await q<any>(sb.from('academic_years').select('name,start_date,end_date').eq('is_current', true).maybeSingle())
    return y || { name: 'Last 12 months', start_date: addDays(today, -365), end_date: today }
  }, [])
  const report = useAsync<any>(() => (year.data ? q(sb.rpc('my_attendance_report', { p_from: year.data.start_date, p_to: today })) : Promise.resolve(null)), [year.data?.start_date])
  const rows = useAsync<any[]>(() => q(sb.from('attendance').select('date,status,period:periods(number)').gte('date', month).lte('date', monthEnd(month)).order('date')), [month])
  const leaves = useAsync<any[]>(() => q(sb.from('leave_requests').select('id,from_date,to_date,reason,status,created_at').eq('requester_id', me.id).order('created_at', { ascending: false }).limit(10)), [])

  const byDate: Record<string, any[]> = {}
  ;(rows.data || []).forEach((r) => (byDate[r.date] ||= []).push(r))
  const first = isoWeekday(month) - 1
  const days = Number(monthEnd(month).slice(8))
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  const [from, setFrom] = useState(addDays(today, 1))
  const [to, setTo] = useState(addDays(today, 1))
  const [reason, setReason] = useState('')
  const { busy, run } = useAction()
  const ask = () => run(async () => { await q(sb.rpc('request_leave', { p_from: from, p_to: to, p_reason: reason })); setReason(''); leaves.reload() }, 'Leave request sent to your class teacher')

  const r = report.data
  return (
    <>
      <PageHead title="My attendance" sub={year.data ? `Academic year ${year.data.name}, up to today` : ''} />
      <Loading loading={report.loading} error={report.error} hasData={!!report.data}>
        {r && (
          <>
            <div className="grid c4">
              <Stat n={r.percent == null ? '–' : `${r.percent}%`} l="Overall attendance" />
              <Stat n={r.present} l="Days present" />
              <Stat n={r.late} l="Late" />
              <Stat n={r.absent} l="Absent" sub={r.leave ? `${r.leave} on approved leave` : undefined} />
            </div>
            {r.percent != null && r.percent < low && <Alert kind="bad">Your attendance is below the school minimum of {low}%. Please speak to your class teacher.</Alert>}
            {(r.by_subject || []).length > 0 && (
              <Card title="By subject">
                {r.by_subject.map((s: any) => (
                  <div key={s.subject} style={{ marginBottom: 10 }}>
                    <div className="row between"><span>{s.subject}</span><b>{s.percent == null ? '–' : `${s.percent}%`}</b></div>
                    <Bar value={s.percent} low={low} />
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </Loading>

      <Card title={fmtMonth(month)} actions={<><Button small onClick={() => setMonth(addMonths(month, -1))}>← Previous</Button><Button small onClick={() => setMonth(monthStart(today))}>Today</Button><Button small onClick={() => setMonth(addMonths(month, 1))}>Next →</Button></>}>
        <div className="cal">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="h">{d}</div>)}
          {cells.map((n, i) => {
            if (!n) return <div key={i} className="d blank" />
            const date = `${month.slice(0, 8)}${String(n).padStart(2, '0')}`
            const list = byDate[date] || []
            const worst = list.length ? list.reduce((a, b) => (rank[b.status] > rank[a.status] ? b : a)) : null
            return (
              <div key={i} className={`d ${worst ? cls[worst.status] : ''} ${date === today ? 'today' : ''}`}>
                <b>{n}</b>
                {worst && <span className="small">{list.length > 1 ? `${list.filter((x) => x.status === 'absent').length || list.filter((x) => x.status === 'late').length || list.length} of ${list.length} periods` : worst.status}</span>}
              </div>
            )
          })}
        </div>
        <div className="row small" style={{ marginTop: 12 }}><StatusBadge status="present" /><StatusBadge status="late" /><StatusBadge status="absent" /><StatusBadge status="leave" /></div>
      </Card>

      <Card title="Ask for leave">
        <p className="muted">Your class teacher will approve or decline. Approved leave is not counted against your attendance.</p>
        <div className="grid c3">
          <Field label="From"><input className="input" type="date" value={from} min={today} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><input className="input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Reason"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. family function" /></Field>
        </div>
        <div style={{ marginTop: 12 }}><Button variant="primary" loading={busy} onClick={ask}>Send request</Button></div>
        {(leaves.data || []).length > 0 && (
          <table className="table" style={{ marginTop: 14 }}><tbody>
            {leaves.data!.map((l) => (
              <tr key={l.id}><td>{fmtDate(l.from_date)}{l.to_date !== l.from_date && ` → ${fmtDate(l.to_date)}`}<br /><span className="small muted">{l.reason}</span></td><td className="num"><StatusBadge status={l.status} /></td></tr>
            ))}
          </tbody></table>
        )}
      </Card>
      {rows.data?.length === 0 && <Empty>No attendance marked in {fmtMonth(month)}.</Empty>}
    </>
  )
}
