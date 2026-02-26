export default function MainLoading() {
  return (
    <div className="space-y-4 px-4 pt-5 animate-in fade-in duration-200">
      <div className="h-[116px] rounded-2xl bg-muted/60 animate-pulse" />
      <div className="flex gap-2">
        <div className="h-11 flex-1 rounded-[13px] bg-muted/60 animate-pulse" />
        <div className="h-11 flex-1 rounded-[13px] bg-muted/60 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[92px] rounded-2xl bg-muted/60 animate-pulse" />
        ))}
      </div>
      <div className="h-[160px] rounded-2xl bg-muted/60 animate-pulse" />
    </div>
  );
}
