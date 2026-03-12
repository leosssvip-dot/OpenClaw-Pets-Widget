import { useState } from 'react';

export function QuickComposer({
  petName,
  promptHint,
  placeholder,
  submitLabel = 'Send Task',
  onSubmit
}: {
  petName: string;
  promptHint?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        const nextValue = value.trim();

        if (!nextValue) {
          return;
        }

        void onSubmit(nextValue);
        setValue('');
      }}
    >
      <div className="composer__heading">
        <h5>Quick prompt</h5>
        <span>{promptHint ?? `Send a focused task to ${petName}.`}</span>
      </div>
      <label className="composer__field">
        <span>Message</span>
        <textarea
          aria-label="Message"
          value={value}
          placeholder={placeholder ?? `Message ${petName}`}
          rows={4}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <div className="composer-actions">
        <div className="composer-tags" aria-hidden="true">
          <span>Attach context</span>
          <span>Keep companion visible</span>
        </div>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
