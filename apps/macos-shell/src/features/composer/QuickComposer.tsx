import { useState } from 'react';

export function QuickComposer({
  petName,
  onSubmit
}: {
  petName: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      className="quick-composer"
      onSubmit={(event) => {
        event.preventDefault();
        const nextValue = value.trim();

        if (!nextValue) {
          return;
        }

        onSubmit(nextValue);
        setValue('');
      }}
    >
      <label>
        Message
        <input
          aria-label="Message"
          value={value}
          placeholder={`Message ${petName}`}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button type="submit">Send</button>
    </form>
  );
}
