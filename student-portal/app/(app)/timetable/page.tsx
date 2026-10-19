'use client'
import { useState } from 'react'
import { Button, Card, Empty, Loading, PageHead } from '@/components/ui'
import { useMe } from '@/lib/profile'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { addDays, cx, fmtDate, fmtTime, isoWeekday, q, startOfWeek, todayISO, WEEKDAYS } from '@/lib/util'

export default function Timetable() {
  const { me, school } = useMe()
  const sb = supabaseBrowser()
  const today = todayISO(school.timezone)
  const [week, setWeek] = useState(startOfWeek(today))
  const d = useAsync(async () => {
    const enr = await q<any>(sb.from('enrolments').select('class_id').eq('student_id', me.id).eq('status', 'active').maybeSingle())
    if (!enr) return null
    const [periods, entries, subs] = await Promise.all([
      q<any[]>(sb.from('periods').select('id,number,label,start_time,end_time').order('number')),
      q<any[]>(sb.from('timetable_entries').select('id,weekday,period_id,teacher_id,subject:subjects(name)').eq('class_id', enr.class_id)),
      q<any[]>(sb.from('substitutions').select('timetable_entry_id,date,status,substitute_id').gte('date', week).lte('date', addDays(week, 6))),
    ])
    const ids = Array.from(new Set([...entries.map((e) => e.teacher_id), ...subs.map((s) => s.substitute_id)].filter(Boolean)))
    const names = ids.length ? await q<any[]>(sb.from('directory').select('id,full_name').in('id', ids)) : []
    return { periods, entries, subs, names: Object.fromEntries(names.map((n) => [n.id, n.full_name])) as Record<string, string> }
  }, [week])
  const days = [1, 2, 3, 4, 5, 6].filter((w) => w <= 6 || (d.data?.entries || []).some((e: any) => e.weekday === w))
  return (
    <>
      <PageHead title="Timetable" sub={`Week of ${fmtDate(week)}`}>
        <Button onClick={() => setWeek(addDays(week, -7))}>← Previous</Button>
        <Button onClick={() => setWeek(startOfWeek(today))}>This week</Button>
        <Button onClick={() => setWeek(addDays(week, 7))}>Next →</Button>
      </PageHead>
      <Loading loading={d.loading} error={d.error} hasData={!!d.data}>
        {d.data === null && <Card><Empty>You are not in a class right now.</Empty></Card>}
        {d.data && (
          <Card flush>
            <div className="table-wrap" style={{ padding: 10 }}>
              <table className="tt">
                <thead><tr><th></th>{days.map((w) => <th key={w}>{WEEKDAYS[w].slice(0, 3)}<br /><span className="muted">{addDays(week, w - 1).slice(8)}</span></th>)}</tr></thead>
                <tbody>
                  {d.data.periods.map((p: any) => (
                    <tr key={p.id}>
                      <th>{p.number}<br /><span className="muted" style={{ textTransform: 'none' }}>{fmtTime(p.start_time)}</span></th>
                      {days.map((w) => {
                        const e = d.data!.entries.find((x: any) => x.weekday === w && x.period_id === p.id)
                        const date = addDays(week, w - 1)
                        if (!e) return <td key={w} className="empty">–</td>
                        const sub = d.data!.subs.find((s: any) => s.timetable_entry_id === e.id && s.date === date)
                        return (
                          <td key={w} className={cx(sub && 'sub', date === today && 'today')}>
                            <b>{e.subject.name}</b>
                            <div className="who">
                              {sub ? (sub.status === 'self_study' ? 'Self study' : `Substitute: ${d.data!.names[sub.substitute_id] || 'teacher'}`) : d.data!.names[e.teacher_id]}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Loading>
    </>
  )
}
