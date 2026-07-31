function isTransformable(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (el.tagName === 'TEXTAREA') return true;
  return ['text', 'tel', 'search'].includes(el.type);
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (!setter) return;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function initAutoUppercase() {
  document.addEventListener(
    'input',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      if (el instanceof HTMLInputElement && (el.type === 'password' || el.type === 'email')) return;
      if (!isTransformable(el)) return;
      const transformed = el.value.toUpperCase();
      if (transformed !== el.value) {
        setNativeValue(el, transformed);
      }
    },
    true,
  );
}
