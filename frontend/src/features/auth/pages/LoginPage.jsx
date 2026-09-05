import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { Input } from "../../../components/ui/input.jsx";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authApi } from "../authApi.js";
import { setCredentials } from "../authSlice.js";

export default function LoginPage() {
  const [spokes, setSpokes] = useState([]);

  useEffect(() => {
    authApi
      .getSpokes()
      .then((res) => setSpokes(res.data ?? []))
      .catch(() => setSpokes([]));
  }, []);

  const [form, setForm] = useState({
    email: "admin@fintree.in",
    password: "Password@123",
    spoke: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!form.spoke && spokes?.length) {
      setForm((prev) => ({ ...prev, spoke: spokes[0]?.name ?? "" }));
    }
  }, [spokes]);

  const submit = async (event) => {
    event.preventDefault();

    try {
      const response = await authApi.login(form);

      // Save either Axios envelope or direct data response.
      const authData = response.data?.data ?? response.data;

      dispatch(setCredentials(authData));

      // Clear previous dismissal flags so Start Work popup shows on fresh login
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("lap_attendance_dismissed")) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {
        // ignore
      }

      // Store login details for session persistence.
      try {
        window.localStorage.setItem("loginDetails", JSON.stringify(authData));
      } catch {
        // ignore storage errors (e.g., private mode)
      }

      const roles = Array.isArray(authData?.user?.roles)
        ? authData.user.roles
        : [];

      const destination = roles.includes("RM") ? "/rmDashboard" : "/dashboard";

      // const destination = roles.includes("ADMIN")
      // ? "/adminDashboard"
      // : "/dashboard";

      navigate(destination, { replace: true });
    } catch (error) {
      console.error(
        "Login failed:",
        error?.response?.data?.message ?? error.message,
      );
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-[#021933]">
      {/* Left Column: Brand Hero Banner */}
      <div className="relative hidden w-[40%] flex-col justify-between border-r border-slate-900/20 bg-gradient-to-b from-[#031e3d] to-[#010f20] p-8 text-white lg:flex lg:p-12 xl:w-[35%]">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200')] bg-cover bg-center" />

        {/* Brand Header */}

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-25 w-48 items-center justify-start bg-transparent ml-40">
            <img
              src="/images/logo-removebg-preview.png"
              alt="Fintree Finance Logo"
              className="h-full w-full object-contain object-left"
            />
          </div>
        </div>

        {/* Hero Central Text */}
        <div className="relative z-[101] flex flex-col justify-center flex-1">
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl lg:text-4xl font-medium tracking-tight text-slate-100 leading-tight">
              Loan Against Property
              <br />
              <span className="text-2xl lg:text-3xl text-slate-400 font-normal">
                Origination System
              </span>
            </h1>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">&nbsp;</div>
      </div>

      {/* Right Column: Glassmorphism Form Wrapper */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-[#021933] to-[#010f20] p-4 sm:p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md transition-all duration-300 lg:max-w-lg">
          <div className="mb-6 flex justify-center lg:hidden">
            <img
              src="/images/logo-removebg-preview.png"
              alt="Fintree Finance Logo"
              className="h-14 w-auto object-contain"
            />
          </div>
          <Card className="w-full rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-5 sm:p-8 md:p-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
                  Secure login
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  Sign in to continue to your account
                </p>
              </div>

              <form className="space-y-5" onSubmit={submit}>
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-300 tracking-wide"
                  >
                    Employee Code / Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/xl"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                      </svg>
                    </span>
                    <Input
                      id="email"
                      type="email"
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent rounded-xl text-base placeholder:text-slate-500 transition-all"
                      placeholder="Enter employee code"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300 tracking-wide"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </span>
                    <Input
                      id="password"
                      type="password"
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent rounded-xl text-base placeholder:text-slate-500 transition-all"
                      placeholder="Enter password"
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Spoke Dropdown */}
                <div className="space-y-2">
                  <label
                    htmlFor="spoke"
                    className="text-sm font-medium text-slate-300 tracking-wide"
                  >
                    Hub / Spoke
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z"
                        />
                      </svg>
                    </span>
                    <select
                      id="spoke"
                      className="w-full pl-11 pr-10 h-12 bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-base appearance-none transition-all cursor-pointer outline-none"
                      value={form.spoke}
                      onChange={(event) =>
                        setForm({ ...form, spoke: event.target.value })
                      }
                    >
                      {spokes?.length ? (
                        spokes.map((s) => (
                          <option
                            key={s.id}
                            value={s.name}
                            className="bg-[#031e3d] text-white"
                          >
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="" className="bg-[#031e3d] text-white">
                          Loading...
                        </option>
                      )}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50 accent-blue-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-medium tracking-wide transition-all shadow-lg shadow-blue-600/20 mt-2"
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
