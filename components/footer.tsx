import { ContactLinks } from "@/components/contact";
import { name, role } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-name">{name}</p>
      <ContactLinks />
      <p className="footer-role">{role}</p>
    </footer>
  );
}
