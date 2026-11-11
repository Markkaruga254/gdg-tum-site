import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Lead Sign in | GDG on Campus TUM",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
