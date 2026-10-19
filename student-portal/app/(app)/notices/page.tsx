'use client'
import NoticesList from '@/components/NoticesList'
import { PageHead } from '@/components/ui'

export default function Notices() {
  return (
    <>
      <PageHead title="Official notices" sub="Messages from the school office" />
      <NoticesList />
    </>
  )
}
