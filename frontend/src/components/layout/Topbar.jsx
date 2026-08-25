import { Link, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, Sun, Moon, LogOut, Plus, ChevronDown } from 'lucide-react';
import { Menu, MenuItem, Avatar, Button } from '../ui';
import { BrandSwitcher } from './BrandSwitcher';
import { useUI } from '../../store/ui';
import { useAuth } from '../../store/auth';
import { useActiveBrand } from '../../hooks/useBrands';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../../lib/api';
import toast from 'react-hot-toast';

export function Topbar() {
  const { theme, toggleTheme, setSidebar } = useUI();
  const { user, logout } = useAuth();
  const { activeBrandId } = useActiveBrand();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: accounts } = useQuery({
    queryKey: ['social', activeBrandId],
    queryFn: () => get(`/social/accounts?brandId=${activeBrandId}`),
    enabled: Boolean(activeBrandId),
  });
  const facebookConnected = accounts?.some((account) => account.platform === 'FACEBOOK');
  const connectFacebook = useMutation({
    mutationFn: async () => {
      const result = await get(`/social/meta/connect?brandId=${activeBrandId}`);
      if (result.devMode) return post('/social/meta/dev-connect', { brandId: activeBrandId });
      window.location.assign(result.url);
      return null;
    },
    onSuccess: (result) => {
      if (result) {
        qc.invalidateQueries({ queryKey: ['social', activeBrandId] });
        toast.success('Connected to Facebook');
      }
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => setSidebar(true)}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-elevated lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <BrandSwitcher />

        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/posts/new')}>
            <Plus className="h-4 w-4" /> New Post
          </Button>
          <Button
            size="sm"
            variant={facebookConnected ? 'success' : 'secondary'}
            className="hidden sm:inline-flex"
            onClick={() => facebookConnected ? navigate('/connections') : connectFacebook.mutate()}
            loading={connectFacebook.isPending}
            disabled={!activeBrandId}
          >
            <span className="font-bold">f</span> {facebookConnected ? 'Connected to Facebook' : 'Connect Facebook'}
          </Button>

          <button
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-elevated hover:text-fg transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Menu
            width="w-56"
            trigger={() => (
              <button className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-elevated transition">
                <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-sm font-medium text-fg truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[11px] text-muted capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted hidden md:block" />
              </button>
            )}
          >
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium text-fg truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <div className="my-1 border-t border-border" />
            <Link to="/brands">
              <MenuItem>Brands & settings</MenuItem>
            </Link>
            <MenuItem icon={LogOut} danger onClick={logout}>
              Sign out
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
