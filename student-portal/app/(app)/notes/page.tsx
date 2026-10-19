'use client'
import { useState } from 'react'
import { Badge, Button, Card, Empty, Field, Loading, PageHead } from '@/components/ui'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync, useDebounced } from '@/lib/hooks'
import { fmtDate, fmtSize, q } from '@/lib/util'
import { openFile } from '@/lib/files'
import { toastError } from '@/lib/toast'

export default function NotesLibrary() {
  const sb = supabaseBrowser()
  const [subject, setSubject] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [text, setText] = useState('')
  const [limit, setLimit] = useState(25)
  const term = useDebounced(text, 300)
  const subjects = useAsync<any[]>(() => q(sb.from('subjects').select('id,name').order('name')), [])
  const notes = useAsync<any[]>(() => {
    let query = sb.from('daily_notes').select('id,title,body,note_date,subject:subjects(name),note_files(id,file_name,storage_path,size_bytes)')
      .order('note_date', { ascending: false }).order('created_at', { ascending: false }).limit(limit)
    if (subject) query = query.eq('subject_id', subject)
    if (from) query = query.gte('note_date', from)
    if (to) query = query.lte('note_date', to)
    if (term) query = query.or(`title.ilike.%${term.replace(/[%,()]/g, ' ')}%,body.ilike.%${term.replace(/[%,()]/g, ' ')}%`)
    return q(query)
  }, [subject, from, to, term, limit])
  return (
    <>
      <PageHead title="Notes library" sub="Every note your teachers have posted for your class" />
      <Card>
        <div className="grid c4">
          <Field label="Subject"><select className="input" value={subject} onChange={(e) => { setSubject(e.target.value); setLimit(25) }}><option value="">All subjects</option>{(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="From"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Search"><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="word in title or text" /></Field>
        </div>
      </Card>
      <Loading loading={notes.loading} error={notes.error} hasData={!!notes.data}>
        {notes.data?.length === 0 && <Card><Empty>No notes found.</Empty></Card>}
        {(notes.data || []).map((n) => (
          <Card key={n.id}>
            <div className="row between"><div className="row"><Badge kind="accent">{n.subject?.name}</Badge><b>{n.title}</b></div><span className="small muted">{fmtDate(n.note_date)}</span></div>
            {n.body && <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>{n.body}</p>}
            <div className="row">{n.note_files.map((f: any) => <Button key={f.id} small onClick={() => openFile('notes', f.storage_path).catch(toastError)}>📎 {f.file_name} <span className="muted">{fmtSize(f.size_bytes)}</span></Button>)}</div>
          </Card>
        ))}
        {notes.data && notes.data.length >= limit && <div className="row" style={{ justifyContent: 'center' }}><Button onClick={() => setLimit(limit + 25)}>Show more</Button></div>}
      </Loading>
    </>
  )
}
