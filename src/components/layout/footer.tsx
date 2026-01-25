import { Activity, Github, Twitter } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pulse-red-500 to-pulse-pink-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">
              © 2026 Yield Pulse. Built for the Mezo community.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm text-gray-500 hover:text-pulse-red-600 transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/faq"
              className="text-sm text-gray-500 hover:text-pulse-red-600 transition-colors"
            >
              FAQ
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pulse-red-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/mezo-org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pulse-red-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
