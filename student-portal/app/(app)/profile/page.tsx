'use client'
import { Card, PageHead } from '@/components/ui'
import ChangePasswordForm from '@/components/ChangePasswordForm'
import { useMe } from '@/lib/profile'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAsync } from '@/lib/hooks'
import { classLabel, q } from '@/lib/util'

export default function Profile() {
  const { me, school } = useMe()
  const sb = supabaseBrowser()
  const enr = useAsync<any>(() => q(sb.from('enrolments').select('roll_no,class:classes(section,grade:grade_levels(name)),year:academic_years(name)').eq('student_id', me.id).eq('status', 'active').maybeSingle()), [])
  return (
    <>
      <PageHead title="My profile" />
      <div className="grid c2">
        <Card title="Details">
          <table className="table"><tbody>
            <tr><td className="muted">Name</td><td><b>{me.full_name}</b></td></tr>
            <tr><td className="muted">Login ID</td><td><b>{me.login_id}</b></td></tr>
            <tr><td className="muted">School</td><td>{school.name}</td></tr>
            <tr><td className="muted">Class</td><td>{enr.loading ? '…' : enr.data ? `${classLabel(enr.data.class)} (roll ${enr.data.roll_no ?? '–'})` : '–'}</td></tr>
            <tr><td className="muted">Academic year</td><td>{enr.loading ? '…' : enr.data?.year?.name ?? '–'}</td></tr>
          </tbody></table>
          <p className="small muted">To change your name or class, ask the school office.</p>
        </Card>
        <Card title="Change password"><ChangePasswordForm loginId={me.login_id} /></Card>
      </div>
    </>
  )
}
