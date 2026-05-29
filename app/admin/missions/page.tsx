"use client";
import { useEffect, useState, useRef } from "react";

type Mission = {
  id: string; title: string; description: string; status: string;
  rewardPoints: number; badgeLabel?: string; startDate: string; endDate: string;
  maxSlots?: number; province?: string;
  place?: { id: string; title: string; slug: string } | null;
  createdAt: string; _count: { participants: number };
};
type Submission = {
  id: string; status: string; photoUrls: string[]; reviewText?: string; submittedAt?: string;
  user: { id: string; username: string; displayName?: string; avatarUrl?: string };
  mission: { id: string; title: string; rewardPoints: number; badgeLabel?: string; place?: { slug: string } | null };
};
type PlaceSuggestion = { id: string; title: string; province: string; district: string; slug: string };

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background: ok?"#059669":"#dc2626", color:"#fff", padding:"12px 20px", borderRadius:10, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", fontWeight:600, fontSize:14 }}>
      {msg}
    </div>
  );
}

function PlaceSearch({ onSelect }: { onSelect: (p: PlaceSuggestion) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [selected, setSelected] = useState<PlaceSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout>();

  const search = (val: string) => {
    setQ(val);
    setSelected(null);
    clearTimeout(timer.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/places?search=${encodeURIComponent(val)}&limit=8`);
      const d = await res.json();
      setResults(d.places || []);
      setOpen(true);
    }, 300);
  };

  const pick = (p: PlaceSuggestion) => {
    setSelected(p);
    setQ(p.title);
    setResults([]);
    setOpen(false);
    onSelect(p);
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"10px 14px", border:"1px solid #d1d5db",
    borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"relative" }}>
      <input
        style={inputStyle}
        value={q}
        onChange={e => search(e.target.value)}
        placeholder="ค้นหาสถานที่ (ไม่บังคับ)..."
        autoComplete="off"
      />
      {selected && (
        <div style={{ fontSize:12, color:"#059669", marginTop:4 }}>
          ✓ {selected.title} · {selected.province} · {selected.district}
        </div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0, zIndex:100,
          background:"#fff", border:"1px solid #e5e7eb", borderRadius:8,
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)", maxHeight:220, overflowY:"auto",
        }}>
          {results.map(p => (
            <div key={p.id} onClick={() => pick(p)} style={{
              padding:"10px 14px", cursor:"pointer", fontSize:14,
              borderBottom:"1px solid #f3f4f6",
              display:"flex", flexDirection:"column", gap:2,
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background="#f0fdf4"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background=""}
            >
              <span style={{ fontWeight:600, color:"#111827" }}>{p.title}</span>
              <span style={{ fontSize:12, color:"#6b7280" }}>📍 {p.province} · {p.district}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMissionsPage() {
  const [tab, setTab] = useState<"missions"|"submissions">("missions");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  const [toggling, setToggling] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [systemEnabled, setSystemEnabled] = useState<boolean|null>(null);
  const [togglingSystem, setTogglingSystem] = useState(false);
  const [form, setForm] = useState({
    title:"", description:"", coverUrl:"", placeId:"", province:"", district:"",
    reward:"", rewardPoints:0, badgeLabel:"", startDate:"", endDate:"", maxSlots:"",
  });

  const showMsg = (msg:string, ok:boolean) => setToast({msg, ok});

  // Load system setting
  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r=>r.json())
      .then(d => setSystemEnabled(d.settings?.missionsEnabled === "true"));
  }, []);

  const toggleSystem = async () => {
    setTogglingSystem(true);
    const next = !systemEnabled;
    await fetch("/api/admin/settings", {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ missionsEnabled: next ? "true" : "false" }),
    });
    setSystemEnabled(next);
    showMsg(next ? "เปิดระบบภารกิจแล้ว ✓" : "ปิดระบบภารกิจแล้ว", true);
    setTogglingSystem(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/missions?tab=${tab}`);
    const data = await res.json();
    if (tab==="missions") setMissions(data.missions||[]);
    else setSubmissions(data.submissions||[]);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [tab]);

  const handleToggle = async (missionId:string) => {
    setToggling(missionId);
    const res = await fetch("/api/admin/missions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({missionId})});
    const data = await res.json();
    if (res.ok) {
      setMissions(prev=>prev.map(m=>m.id===missionId?{...m,status:data.status}:m));
      showMsg(data.status==="ACTIVE"?"เปิดภารกิจแล้ว ✓":"ปิดภารกิจแล้ว", true);
    } else showMsg(data.error||"เกิดข้อผิดพลาด", false);
    setToggling(null);
  };

  const handleCreate = async (e:React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/missions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,rewardPoints:Number(form.rewardPoints),maxSlots:form.maxSlots?Number(form.maxSlots):null})});
    const data = await res.json();
    if (res.ok) {
      showMsg("สร้างภารกิจสำเร็จ!", true);
      setShowForm(false);
      setForm({title:"",description:"",coverUrl:"",placeId:"",province:"",district:"",reward:"",rewardPoints:0,badgeLabel:"",startDate:"",endDate:"",maxSlots:""});
      fetchData();
    } else showMsg(data.error||"เกิดข้อผิดพลาด", false);
  };

  const handleReview = async (participantId:string, action:"APPROVE"|"REJECT") => {
    const res = await fetch("/api/admin/missions",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({participantId,action})});
    const data = await res.json();
    if (res.ok) {
      showMsg(action==="APPROVE"?"อนุมัติแล้ว + ให้แต้ม":"ปฏิเสธแล้ว", true);
      setSubmissions(prev=>prev.filter(s=>s.id!==participantId));
    } else showMsg(data.error||"เกิดข้อผิดพลาด", false);
  };

  const inputStyle:React.CSSProperties = {width:"100%",padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 24px"}}>
      {/* Header + system toggle */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#111827",margin:0}}>🎯 จัดการภารกิจ</h1>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {/* System on/off */}
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",borderRadius:12,padding:"10px 16px",border:"1px solid #e5e7eb"}}>
            <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>ระบบภารกิจ:</span>
            <span style={{fontSize:13,fontWeight:700,color:systemEnabled?"#059669":"#9ca3af"}}>
              {systemEnabled===null?"..." : systemEnabled?"เปิดอยู่":"ปิดอยู่"}
            </span>
            <button
              onClick={toggleSystem}
              disabled={togglingSystem||systemEnabled===null}
              title={systemEnabled?"คลิกเพื่อปิดระบบ":"คลิกเพื่อเปิดระบบ"}
              style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:systemEnabled?"#10b981":"#d1d5db",position:"relative",transition:"background 0.2s",opacity:togglingSystem?0.5:1}}
            >
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:systemEnabled?27:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </button>
          </div>
          <button onClick={()=>setShowForm(!showForm)} style={{background:showForm?"#f3f4f6":"#10b981",color:showForm?"#374151":"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontWeight:600,fontSize:14,cursor:"pointer"}}>
            {showForm?"ยกเลิก":"+ สร้างภารกิจ"}
          </button>
        </div>
      </div>

      {/* Warning banner when system is off */}
      {systemEnabled===false && (
        <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:14,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>
          ⚠️ <strong>ระบบภารกิจปิดอยู่</strong> — ผู้ใช้จะไม่เห็นหน้า /missions และเมนูในทุกที่ จนกว่าจะเปิดระบบ
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.08)",marginBottom:28}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 20px"}}>สร้างภารกิจใหม่</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>ชื่อภารกิจ *</label>
              <input style={inputStyle} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>คำอธิบาย *</label>
              <textarea style={{...inputStyle,minHeight:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>สถานที่ (ค้นหา)</label>
              <PlaceSearch onSelect={p => setForm(f=>({...f,placeId:p.id,province:p.province,district:p.district}))}/>
            </div>
            {/* Province/District show as read-only after place selected */}
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>จังหวัด (auto-fill)</label>
              <input style={{...inputStyle,background:"#f9fafb"}} value={form.province} onChange={e=>setForm(f=>({...f,province:e.target.value}))} placeholder="จะ fill อัตโนมัติเมื่อเลือกสถานที่"/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>URL รูปปก</label>
              <input style={inputStyle} value={form.coverUrl} onChange={e=>setForm(f=>({...f,coverUrl:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>วันเริ่ม *</label>
              <input type="date" style={inputStyle} value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} required/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>วันสิ้นสุด *</label>
              <input type="date" style={inputStyle} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} required/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>แต้มรางวัล</label>
              <input type="number" style={inputStyle} value={form.rewardPoints} onChange={e=>setForm(f=>({...f,rewardPoints:Number(e.target.value)}))}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Badge Label</label>
              <input style={inputStyle} value={form.badgeLabel} onChange={e=>setForm(f=>({...f,badgeLabel:e.target.value}))} placeholder="เช่น นักเดินทางมือทอง"/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>รางวัลพิเศษ</label>
              <input style={inputStyle} value={form.reward} onChange={e=>setForm(f=>({...f,reward:e.target.value}))} placeholder="เช่น บัตรกำนัล 500 บาท"/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>จำนวนสูงสุด</label>
              <input type="number" style={inputStyle} value={form.maxSlots} onChange={e=>setForm(f=>({...f,maxSlots:e.target.value}))} placeholder="เว้นว่าง = ไม่จำกัด"/>
            </div>
          </div>
          <button type="submit" style={{marginTop:20,background:"#10b981",color:"#fff",border:"none",padding:"11px 28px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>
            สร้างภารกิจ
          </button>
        </form>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"#f3f4f6",borderRadius:10,padding:4,width:"fit-content"}}>
        {(["missions","submissions"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:14,background:tab===t?"#fff":"transparent",color:tab===t?"#059669":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.2s"}}>
            {t==="missions"?"🎯 ภารกิจทั้งหมด":"📋 รอตรวจสอบ"}
            {t==="submissions"&&submissions.length>0&&<span style={{marginLeft:6,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11}}>{submissions.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"#6b7280"}}>กำลังโหลด...</div>
      ) : tab==="missions" ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {missions.length===0&&<div style={{textAlign:"center",padding:60,color:"#6b7280"}}>ยังไม่มีภารกิจ</div>}
          {missions.map(m=>(
            <div key={m.id} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:16,opacity:m.status==="INACTIVE"?0.65:1,transition:"opacity 0.2s"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:15,color:"#111827"}}>{m.title}</span>
                  <span style={{fontSize:11,fontWeight:700,borderRadius:10,padding:"2px 8px",background:m.status==="ACTIVE"?"#d1fae5":"#f3f4f6",color:m.status==="ACTIVE"?"#059669":"#6b7280"}}>
                    {m.status==="ACTIVE"?"เปิด":"ปิด"}
                  </span>
                </div>
                <div style={{fontSize:13,color:"#6b7280"}}>
                  {m.place&&<>📍 <a href={`/place/${m.place.slug}`} target="_blank" rel="noreferrer" style={{color:"#2563eb",textDecoration:"none",fontWeight:600}}>{m.place.title}</a> · </>}
                  {!m.place&&m.province&&<>📍 {m.province} · </>}
                  👥 {m._count.participants}{m.maxSlots?`/${m.maxSlots}`:""} คน · ⭐ {m.rewardPoints} แต้ม · หมด {new Date(m.endDate).toLocaleDateString("th-TH")}
                </div>
              </div>
              <button onClick={()=>handleToggle(m.id)} disabled={toggling===m.id} style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:m.status==="ACTIVE"?"#10b981":"#d1d5db",position:"relative",flexShrink:0,transition:"background 0.2s",opacity:toggling===m.id?0.5:1}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:m.status==="ACTIVE"?27:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {submissions.length===0&&<div style={{textAlign:"center",padding:60,color:"#6b7280"}}>ไม่มีผลงานรอตรวจ</div>}
          {submissions.map(s=>(
            <div key={s.id} style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>
                    {s.mission.title}
                    {s.mission.place&&<a href={`/place/${s.mission.place.slug}`} target="_blank" rel="noreferrer" style={{marginLeft:8,fontSize:12,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>→ ดูสถานที่</a>}
                  </div>
                  <div style={{fontSize:13,color:"#6b7280"}}>
                    โดย {s.user.displayName||s.user.username}
                    {s.submittedAt&&` · ${new Date(s.submittedAt).toLocaleDateString("th-TH")}`}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>handleReview(s.id,"APPROVE")} style={{background:"#10b981",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>อนุมัติ ✓</button>
                  <button onClick={()=>handleReview(s.id,"REJECT")} style={{background:"#fee2e2",color:"#dc2626",border:"none",padding:"8px 16px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>ปฏิเสธ</button>
                </div>
              </div>
              {s.reviewText&&<div style={{fontSize:14,color:"#374151",background:"#f9fafb",borderRadius:8,padding:"10px 14px",marginBottom:12}}>{s.reviewText}</div>}
              {s.photoUrls?.length>0&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {s.photoUrls.map((url,i)=>(
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" style={{width:80,height:80,objectFit:"cover",borderRadius:8,border:"1px solid #e5e7eb"}}/>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toast&&<Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}
    </div>
  );
}
