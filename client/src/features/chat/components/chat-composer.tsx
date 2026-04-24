type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({ value, onChange, onSend }: ChatComposerProps) {
  return (
    <div className="chat-composer">
      <input
        className="chat-composer__input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder="Write a message..."
      />
      <button className="chat-composer__button" type="button" onClick={onSend}>
        Send
      </button>
    </div>
  );
}
