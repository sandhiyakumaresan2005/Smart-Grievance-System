import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, LogOut, PlusCircle, LayoutDashboard, ClipboardList, LogIn, UserPlus, BarChart2, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Quiet fail if not logged in or network error
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn('Failed to mark all as read:', e.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (e) {
        console.warn('Failed to mark notification as read:', e.message);
      }
    }
    if (notif.complaintId) {
      setShowNotifs(false);
      navigate(`/complaints/${notif.complaintId}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => navigate('/')}>
        <ShieldAlert size={26} color="var(--accent-cyan)" />
        <span>SCGRS</span>
      </div>

      <ul className="nav-links">
        {/* Public Landing Link */}
        <li className="nav-link" onClick={() => navigate('/')}>Home</li>

        {user ? (
          <>
            {/* Student Links */}
            {user.role === 'student' && (
              <>
                <li 
                  className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`}
                  onClick={() => navigate('/student/dashboard')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LayoutDashboard size={16} /> Dashboard
                  </span>
                </li>
                <li 
                  className={`nav-link ${isActive('/student/complaints') ? 'active' : ''}`}
                  onClick={() => navigate('/student/complaints')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ClipboardList size={16} /> My Complaints
                  </span>
                </li>
                <li 
                  className={`nav-link btn-primary ${isActive('/student/submit') ? 'active' : ''}`}
                  onClick={() => navigate('/student/submit')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PlusCircle size={16} /> File Grievance
                  </span>
                </li>
              </>
            )}

            {/* Admin Links */}
            {user.role === 'admin' && (
              <>
                <li 
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/dashboard')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LayoutDashboard size={16} /> Admin Panel
                  </span>
                </li>
                <li 
                  className={`nav-link ${isActive('/admin/complaints') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/complaints')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ClipboardList size={16} /> Grievances
                  </span>
                </li>
                <li 
                  className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/analytics')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BarChart2 size={16} /> Analytics
                  </span>
                </li>
              </>
            )}

              <div className="nav-notifications-wrapper" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    if (!showNotifs) fetchNotifications();
                  }}
                  style={{
                    background: showNotifs ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: showNotifs ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '1px 5px',
                      minWidth: '16px',
                      textAlign: 'center',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifs && (
                  <div style={{
                    position: 'absolute',
                    top: '46px',
                    right: '0',
                    width: '340px',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                    zIndex: 1000,
                    padding: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderRadius: '8px',
                              background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.08)',
                              border: n.isRead ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(56, 189, 248, 0.25)',
                              cursor: n.complaintId ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: n.isRead ? 600 : 700, color: n.isRead ? 'var(--text-primary)' : 'var(--accent-cyan)' }}>
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }}></span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                              {n.message}
                            </p>
                            <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Session Info */}
              <div className="nav-user">
                <span className="user-badge">{user.role}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {user.name.split(' ')[0]}
                </span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            </>
        ) : (
          <>
            {/* Guest Links */}
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogIn size={16} /> Login
            </button>
            <button 
              className="btn btn-blue"
              onClick={() => navigate('/register')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={16} /> Register
            </button>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
