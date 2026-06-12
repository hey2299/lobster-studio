// User Account System v1 — simple local user management
// Supports: register, login, logout, profile, session persistence
// Data stored in SQLite via database.js

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { getSetting, setSetting } = require('./database');

// Simple password hashing with PBKDF2
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Register a new user
async function register(username, email, password) {
  // Validate
  if (!username || username.length < 2) return { success: false, error: '用户名至少2个字符' };
  if (!email || !isValidEmail(email)) return { success: false, error: '邮箱格式不正确' };
  if (!password || password.length < 6) return { success: false, error: '密码至少6个字符' };

  // Check existing
  const existing = await getSetting('user_accounts');
  let accounts = existing ? JSON.parse(existing) : [];
  
  if (accounts.find(a => a.username === username)) {
    return { success: false, error: '用户名已存在' };
  }
  if (accounts.find(a => a.email === email)) {
    return { success: false, error: '邮箱已被注册' };
  }

  // Create user
  const { hash, salt } = hashPassword(password);
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    email,
    hash,
    salt,
    createdAt: Date.now(),
    lastLogin: null,
    avatar: null,
    bio: '',
    settings: {},
  };
  
  accounts.push(user);
  await setSetting('user_accounts', JSON.stringify(accounts));
  
  // Auto-login
  const session = { userId: user.id, username: user.username, email: user.email };
  await setSetting('user_session', JSON.stringify(session));
  
  return { success: true, data: { id: user.id, username: user.username, email: user.email } };
}

// Login
async function login(identifier, password) {
  const existing = await getSetting('user_accounts');
  const accounts = existing ? JSON.parse(existing) : [];
  
  // Find by username or email
  const user = accounts.find(a => a.username === identifier || a.email === identifier);
  if (!user) return { success: false, error: '用户不存在' };

  // Verify password
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.hash) return { success: false, error: '密码错误' };

  // Update last login
  user.lastLogin = Date.now();
  await setSetting('user_accounts', JSON.stringify(accounts));

  // Create session
  const session = { userId: user.id, username: user.username, email: user.email };
  await setSetting('user_session', JSON.stringify(session));
  
  return { success: true, data: { id: user.id, username: user.username, email: user.email } };
}

// Logout
async function logout() {
  await setSetting('user_session', '');
  return { success: true };
}

// Get current session
async function getSession() {
  const sessionStr = await getSetting('user_session');
  if (!sessionStr) return { authenticated: false };
  try {
    const session = JSON.parse(sessionStr);
    return { authenticated: true, ...session };
  } catch {
    return { authenticated: false };
  }
}

// Update profile
async function updateProfile(userId, updates) {
  const existing = await getSetting('user_accounts');
  let accounts = existing ? JSON.parse(existing) : [];
  const idx = accounts.findIndex(a => a.id === userId);
  if (idx === -1) return { success: false, error: '用户不存在' };
  
  const allowed = ['avatar', 'bio', 'settings'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      accounts[idx][key] = updates[key];
    }
  }
  
  await setSetting('user_accounts', JSON.stringify(accounts));
  return { success: true, data: { id: accounts[idx].id, username: accounts[idx].username, email: accounts[idx].email } };
}

// Get user list (admin)
async function getUsers() {
  const existing = await getSetting('user_accounts');
  const accounts = existing ? JSON.parse(existing) : [];
  return accounts.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));
}

module.exports = { register, login, logout, getSession, updateProfile, getUsers };
