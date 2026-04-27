export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-10">
      <span className="loader" />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
