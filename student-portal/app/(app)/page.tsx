'use client'
import Link from 'next/link'
import { Badge, Card, Empty, Loading, PageHead, StatusBadge } from '@/components/ui'
import { useMe } from '@/lib/profile'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { classLabel, fmtDate, fmtTime, isoWeekday, q, todayISO } from '@/lib/util'

export default function Home() {
  const { me, school } = useMe()
  const sb = supabaseBrowser()
  const today = todayISO(school.timezone)

  const d = useAsync(async () => {
    const enr = await q<any>(sb.from('enrolments').select('id,roll_no,class:classes(id,section,grade:grade_levels(name))').eq('student_id', me.id).eq('status', 'active').maybeSingle())
    if (!enr) return { enr: null }
    const [tt, subs, att, notes, unreadNotices] = await Promise.all([
      q<any[]>(sb.from('timetable_entries').select('id,teacher_id,period:periods(number,start_time,end_time),subject:subjects(name)').eq('class_id', enr.class.id).eq('weekday', isoWeekday(today))),
      q<any[]>(sb.from('substitutions').select('timetable_entry_id,status,substitute_id').eq('date', today)),
      q<any[]>(sb.from('attendance').select('status,period:periods(number)').eq('enrolment_id', enr.id).eq('date', today)),
      q<any[]>(sb.from('daily_notes').select('id,title,note_date,subject:subjects(name)').eq('class_id', enr.class.id).order('note_date', { ascending: false }).order('created_at', { ascending: false }).limit(5)),
      sb.from('notice_reads').select('notice_id', { count: 'exact', head: true }).eq('profile_id', me.id).is('read_at', null),
    ])
    const ids = Array.from(new Set([...tt.map((t) => t.teacher_id), ...subs.map((s) => s.substitute_id)].filter(Boolean)))
    const names = ids.length ? await q<any[]>(sb.from('directory').select('id,full_name').in('id', ids)) : []
    return { enr, tt: tt.sort((a, b) => a.period.number - b.period.number), subs, att, notes, unread: unreadNotices.count || 0, names: Object.fromEntries(names.map((n) => [n.id, n.full_name])) as Record<string, string> }
  }, [])

  const v = d.data as any
  return (
    <>
      <PageHead title={`Hello, ${me.full_name.split(' ')[0]}`} sub={v?.enr ? `Class ${classLabel(v.enr.class)} · Roll no. ${v.enr.roll_no ?? '–'} · ${fmtDate(today)}` : fmtDate(today)} />
      <Loading loading={d.loading} error={d.error} hasData={!!d.data}>
        {v && !v.enr && <Card><Empty>You are not in a class right now. Please ask the school office.</Empty></Card>}
        {v?.enr && (
          <div className="grid c2">
            <Card title="Today's attendance">
              {v.att.length === 0 ? <p className="muted">Not marked yet today.</p> : (
                <div className="row">
                  {v.att.map((a: any, i: number) => <span key={i} className="row" style={{ gap: 6 }}>{a.period && <span className="small muted">Period {a.period.number}</span>}<StatusBadge status={a.status} /></span>)}
                </div>
              )}
              {v.att.some((a: any) => a.status === 'absent') && (
                <p style={{ marginTop: 12, marginBottom: 0 }}>You missed a class today. <Link href="/missed-notes">See the notes you missed →</Link></p>
              )}
            </Card>
            <Card title="Alerts">
              <div className="stack">
                <Link href="/notices">Official notices {v.unread > 0 && <Badge kind="accent">{v.unread} new</Badge>}</Link>
                <Link href="/messages">Messages</Link>
                <Link href="/report-cards">Report cards</Link>
              </div>
            </Card>
            <Card title="Today's timetable">
              {v.tt.length === 0 && <Empty>No lessons scheduled today.</Empty>}
              <table className="table"><tbody>
                {v.tt.map((t: any) => {
                  const sub = v.subs.find((s: any) => s.timetable_entry_id === t.id)
                  return (
                    <tr key={t.id}>
                      <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{t.period.number}<br />{fmtTime(t.period.start_time)}</td>
                      <td><b>{t.subject.name}</b><br /><span className="small muted">{v.names[t.teacher_id] || ''}</span></td>
                      <td className="num">
                        {sub?.status === 'self_study' && <Badge kind="accent">Self study</Badge>}
                        {sub && sub.status !== 'self_study' && <Badge kind="warn">Substitute: {v.names[sub.substitute_id] || 'teacher'}</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody></table>
            </Card>
            <Card title="Latest notes" actions={<Link href="/notes">All notes →</Link>}>
              {v.notes.length === 0 && <Empty>No notes yet.</Empty>}
              {v.notes.map((n: any) => (
                <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <b>{n.title}</b><br /><span className="small muted">{n.subject?.name} · {fmtDate(n.note_date)}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Loading>
    </>
  )
}
