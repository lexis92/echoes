import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingFooter() {
  return (
    <footer className="border-t border-ink/[0.07] py-12">
      <div className="container">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-6" />
              <span className="font-display text-lg tracking-tightest text-ink">Echoes</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-quiet">
              A personal message vault. Share one link, keep every message
              forever.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-6 text-sm">
            <div>
              <p className="label mb-3 text-faint">Product</p>
              <ul className="space-y-2 text-quiet">
                <li><a href="#how" className="hover:text-ink">How it works</a></li>
                <li><a href="#send" className="hover:text-ink">What you can send</a></li>
                <li><a href="#questions" className="hover:text-ink">Questions</a></li>
              </ul>
            </div>
            <div>
              <p className="label mb-3 text-faint">Account</p>
              <ul className="space-y-2 text-quiet">
                <li><Link href="/signup" className="hover:text-ink">Create a vault</Link></li>
                <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
                <li><Link href="/reset-password" className="hover:text-ink">Reset password</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col-reverse items-start gap-4 border-t border-ink/[0.07] pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Echoes. Built for the things people mean to say.</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
