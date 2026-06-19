import { useState } from 'react';
import { Button, Paper, TextField, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../authSlice.js';
import { authApi } from '../authApi.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@fintree.in', password: 'Password@123' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    const response = await authApi.login(form);
    dispatch(setCredentials(response.data));
    navigate('/dashboard');
  };
  return <Paper className="w-full max-w-md p-6" elevation={0}><Typography variant="h4" className="mb-1">Fintree LAP-LIP</Typography><Typography color="text.secondary" className="mb-5">Sign in to continue</Typography><form className="grid gap-4" onSubmit={submit}><TextField label="Email" size="small" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><TextField label="Password" size="small" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><Button type="submit" variant="contained">Login</Button></form></Paper>;
}
