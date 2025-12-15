import { NavLink } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAVIGATION: NavSection[] = [
  {
    label: 'Operación',
    items: [
      { label: 'Personal', to: '/personal' },
      { label: 'Reuniones', to: '/reuniones' },
      { label: 'Tareas', to: '/tareas' },
      { label: 'Informativos', to: '/informativos' },
      { label: 'Asistencia', to: '/asistencia' },
      { label: 'Credenciales de Respaldo', to: '/credenciales' },
      { label: 'Solicitudes', to: '/solicitudes' },
    ],
  },
  {
    label: 'Aseo',
    items: [
      { label: 'Interior', to: '/aseo/interior' },
      { label: 'Exterior', to: '/aseo/exterior' },
      { label: 'Rodillo', to: '/aseo/rodillo' },
    ],
  },
  {
    label: 'MiniCheck',
    items: [
      { label: 'Extintor', to: '/minicheck/extintor' },
      { label: 'Tag', to: '/minicheck/tag' },
      { label: 'Mobileye', to: '/minicheck/mobileye' },
      { label: 'Odómetro', to: '/minicheck/odometro' },
      { label: 'Publicidad', to: '/minicheck/publicidad' },
    ],
  },
  {
    label: 'Flota',
    items: [{ label: 'Estado de Flota', to: '/estado-flota' }],
  },
];

export const Sidebar = ({ isOpen, onClose }: Props) => {
  const baseStyles =
    'block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700';

  const content = (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto bg-white px-4 pb-6 pt-6 shadow-lg md:shadow-none">
      <div className="flex items-center justify-between md:hidden">
        <p className="text-base font-bold text-slate-900">Menú</p>
        <button className="text-sm text-slate-500" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <nav className="space-y-6">
        {NAVIGATION.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${baseStyles} ${isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : ''}`
                  }
                  onClick={onClose}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div>
      {/* Mobile overlay */}
      <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 z-30 bg-black/30 md:hidden`} onClick={onClose} />
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-72 transform transition-transform md:static md:z-auto md:block md:w-64 md:translate-x-0`}
      >
        {content}
      </div>
    </div>
  );
};
