"use client";

export default function PageLoading({ text = "กำลังโหลด..." }: { text?: string }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#0a1628", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(16,185,129,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.035) 1px,transparent 1px)", backgroundSize:"44px 44px" }} />
      <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:20, textAlign:"center", padding:"48px 32px 40px", background:"rgba(10,22,40,0.72)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:28, border:"1px solid rgba(16,185,129,0.18)", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", minWidth:260 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", border:"1.5px solid rgba(16,185,129,0.55)", background:"rgba(16,185,129,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, animation:"pl_lp 2.8s ease-in-out infinite" }}>🗺️</div>
        <div>
          <div style={{ fontSize:28, fontWeight:900, background:"linear-gradient(100deg,#10b981,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:4 }}>ไปเล่า</div>
          <div style={{ fontSize:9, letterSpacing:7, color:"rgba(255,255,255,0.28)", marginTop:4 }}>PAI · LAO</div>
        </div>
        <div style={{ width:"100%", height:1, background:"linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent)" }} />
        <div style={{ fontSize:13, color:"#34d399", letterSpacing:0.3 }}>{text}</div>
        <div style={{ width:160, height:2, background:"rgba(255,255,255,0.05)", borderRadius:999, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#10b981,#06b6d4)", borderRadius:999, animation:"pl_sc 1.9s ease-in-out infinite" }} />
        </div>
      </div>
      <style>{`@keyframes pl_lp{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.25)}50%{box-shadow:0 0 0 14px rgba(16,185,129,0)}}@keyframes pl_sc{0%{width:0%;margin-left:0}55%{width:100%;margin-left:0}56%{width:0%;margin-left:100%}100%{width:0%;margin-left:100%}}`}</style>
    </div>
  );
}
