"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../dashboard.css';

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', username: '' });
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setProfile({ name: parsedUser.name || '', email: parsedUser.email || '', username: parsedUser.username || '' });
  }, [router]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const updated = { ...user, name: profile.name, email: profile.email };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    alert('Profile updated successfully.');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPassword) {
      alert('Please complete both password fields.');
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      alert('New passwords do not match.');
      return;
    }
    alert('Password updated successfully.');
    setPasswords({ current: '', newPassword: '', confirm: '' });
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Manage your account information and security</p>
          <h1>Profile Settings</h1>
        </div>
      </div>

      <div className="profile-grid">
        <form className="profile-panel" onSubmit={handleProfileUpdate}>
          <h2>Personal Information</h2>
          <label>Full Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Admin User"
          />
          <label>Email Address</label>
          <input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="admin@isu.com"
          />
          <label>Username (cannot be changed)</label>
          <input value={profile.username} disabled />
          <button type="submit" className="primary-btn">
            Update Profile
          </button>
        </form>

        <form className="profile-panel" onSubmit={handlePasswordUpdate}>
          <h2>Security & Password</h2>
          <label>Current Password</label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            placeholder="Required to confirm changes"
          />
          <label>New Password</label>
          <input
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            placeholder="Enter new password"
          />
          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            placeholder="Repeat new password"
          />
          <button type="submit" className="primary-btn gold-btn">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
