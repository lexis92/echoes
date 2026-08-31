import Link from "next/link";
import { AuthAside } from "@/components/auth/auth-aside";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <AuthAside />

      <main id="main" className="relative grain flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 ember-bloom lg:hidden" aria-hidden />

        <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
          <Logo className="lg:invisible" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-[26rem] animate-fade-up">{children}</div>
        </div>

        <footer className="relative px-6 py-6 text-center text-xs text-faint sm:px-10">
          <Link href="/" className="underline-offset-4 hover:text-quiet hover:underline">
            About Echoes
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <span>Your messages are private by default.</span>
        </footer>
      </main>
    </div>
  );
}
