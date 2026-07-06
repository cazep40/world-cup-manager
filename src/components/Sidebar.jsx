import { Link } from 'react-router-dom'
import { navLinks } from '../utils/navigation'

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant shadow-sm flex flex-col py-6 z-40">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-2xl">
              sports_soccer
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-primary">
            FIFA Mundial 2026
          </h1>
        </div>
        <p className="text-caption text-on-surface-variant ml-13">
          Official Tournament Manager
        </p>
      </div>

      <nav className="overflow-y-auto px-4 flex flex-col gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 text-body-md font-medium"
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* 🏆 LOGO DEL MUNDIAL DEBAJO DEL MENÚ */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 opacity-95 hover:opacity-100 transition-opacity">
        <img 
          src="/logo2mundial.jpg" 
          alt="Logo FIFA 2026" 
          className="w-full max-w-[160px] h-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.06)]"
        />
      </div>

      <div className="px-4 mt-auto pt-4 border-t border-outline-variant">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 text-body-md font-medium"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </a>
      </div>
    </aside>
  )
}