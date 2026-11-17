import { contact } from "@/lib/content";

export function ContactLinks({ className = "" }: { className?: string }) {
  return (
    <address className={className ? `contact ${className}` : "contact"}>
      <a href={`mailto:${contact.email}`}>{contact.email}</a>
      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
        {contact.whatsappLabel}
      </a>
    </address>
  );
}
