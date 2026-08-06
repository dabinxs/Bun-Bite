import { useState } from "react";
import { X, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function AccountModal() {
  const {
    authModalOpen,
    authMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const resetError = () => setError("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetError();
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError("Login failed. Please check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    resetError();
    setSubmitting(true);

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        mobile,
      });
    } catch (err) {
      setError("Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close account modal"
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111111] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.75)]">
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all hover:border-[#FF3B3B]/40 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/images/logo.png"
            alt="Bun & Bite"
            className="h-16 w-16 object-contain"
          />

          <h2 className="mt-4 font-display text-3xl font-black">
            {authMode === "login" ? "Sign in your Account" : "Create an account"}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Creating an account and logging in unlocks checkout, cart, pickup,
            delivery, and order tracking features.
          </p>
        </div>

        {authMode === "intro" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Register
            </button>

            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] text-sm font-black text-white transition-all hover:border-[#FF3B3B]/35"
            >
              Login
            </button>

            <button
              type="button"
              onClick={closeAuthModal}
              className="h-11 w-full text-sm font-bold text-white/45 transition-colors hover:text-white"
            >
              Continue browsing as guest
            </button>
          </div>
        )}

        {authMode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <AuthInput
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />

            <AuthInput
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />

            {error && <p className="text-sm font-bold text-[#FF8A80]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="h-10 w-full text-sm font-bold text-white/45 transition-colors hover:text-white"
            >
              New to Bun & Bite? Register
            </button>
          </form>
        )}

        {authMode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <AuthInput
                icon={User}
                placeholder="First name"
                value={firstName}
                onChange={setFirstName}
              />
              <AuthInput
                icon={User}
                placeholder="Last name"
                value={lastName}
                onChange={setLastName}
              />
            </div>

            <AuthInput
              icon={Phone}
              type="tel"
              placeholder="Mobile number"
              value={mobile}
              onChange={setMobile}
            />

            <AuthInput
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />

            <AuthInput
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />

            {error && <p className="text-sm font-bold text-[#FF8A80]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Register"}
            </button>

            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="h-10 w-full text-sm font-bold text-white/45 transition-colors hover:text-white"
            >
              Already have an account? Login
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-white/35">
          By continuing, you agree to our Terms & Conditions and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function AuthInput({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 transition-colors focus-within:border-[#FF3B3B]/45">
      <Icon className="h-4 w-4 shrink-0 text-[#FF4D2E]" />
      <input
        type={type}
        required={type !== "tel"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
      />
    </label>
  );
}
