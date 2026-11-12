import { useEffect } from 'react';
export function useTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Karnataka Stays` : 'Karnataka Stays';
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
      m.content = description;
    }
  }, [title, description]);
}
