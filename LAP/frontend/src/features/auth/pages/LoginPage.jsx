import { useState } from 'react';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent } from '../../../components/ui/card.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { H4 } from '../../../components/ui/typography.jsx';

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
  return (
    <Card className="w-full max-w-md overflow-hidden">
      <CardContent className="p-6">
        <H4 className="mb-1">Fintree LAP-LIP</H4>
        <p className="mb-5 text-sm text-muted-foreground">Sign in to continue</p>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-1">
            <span className="text-sm">Email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Password</span>
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <Button type="submit" variant="contained">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

