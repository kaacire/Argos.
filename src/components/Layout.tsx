import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Outlet />
      <BottomNav />
    </div>
  )
}
  