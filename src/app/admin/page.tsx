import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/AdminDashboard'
import { getSession } from '@/lib/auth'

export default async function AdminPage() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminDashboard />
}
