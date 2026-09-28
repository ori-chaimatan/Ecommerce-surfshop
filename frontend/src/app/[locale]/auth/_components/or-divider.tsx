import { texts } from './components-texts';

export function OrDivider() {
  return (
    <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
      <span className="h-px flex-1 bg-border" />
      {texts.or}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
