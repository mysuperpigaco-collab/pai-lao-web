"use client";
import { useEffect, useState } from "react";

type Promotion = {
  id: string; title: string; discount?: string; condition?: string;
  startDate: string; endDate: string; status: string; adminNote?: string;
  business: { id: string; businessName: string; logoUrl?: string };
  place?: { id: string; title: string; slug: string } | null;
};

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:ok?"#059669":"#dc2626", color:"#fff", padding:"12px 20px", borderRadius:10, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", fontWeight:600, fontSize:14 }}>
      {msg}
    </div>
  );
}

const STATUS_TABS = ["PENDING","ACTIVE","REJECTED","INACTIVE"] as const;
const STATUS_LABELS: Record<string,string> = { PENDING:"รอพิจารณา", ACTIVE:"กำลังแสดง", REJECTED:"ปฏิเสธ", INACTIVE:"ปิดชั่วคราว" };

export default function AdminPromotionsPage() {
  const [tab, setTab] = useState<string>("PENDING");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  const [toggling, setToggling] = useState<string|null>(null);
  const [systemEnabled, setSystemEnabled] = useState<boolean|null>(null);
  const [togglingSystem, setTogglingSystem] = useState(false);

  const showMsg = (msg:string, ok:boolean) => setToast({msg, ok});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r=>r.json())
      .then(d=>setSystemEnabled(d.settings?.promotionsEnabled==="true"));
  }, []);

  const toggleSystem = async () => {
    setTogglingSystem(true);
    const next = !systemEnabled;
    await fetch("/api/admin/settings",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({promotionsEnabled:next?"true":"false"}) });
    setSystemEnabled(next);
    showMsg(next?"เปิดระบบโปรโมชั่นแล้ว ✓":"ปิดระบบโปรโมชั่นแล้ว", true);
    setTogglingSystem(false);
  };

  const fetchData = async (status=tab) => {
    setLoading(true);
    const res = await fetch(`/api/admin/promotions?status=${status}`);
    const data = await res.json();
    setPromotions(data.promotions||[]);
    setLoading(false);
  };
  useEffect(() => { fetchData(tab); }, [tab]);

  const handleReview = async (promotionId:string, action:"APPROVE"|"REJECT") => {
    const res = await fetch("/api/admin/promotions",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({promotionId,action}) });
    const data = await res.json();
    if (res.ok) { showMsg(action==="APPROVE"?"อนุมัติโปรโมชั่นแล้ว ✓":"ปฏิเสธแล้ว",true); setPromotions(prev=>prev.filter(p=>p.id!==promotionId)); }
    else showMsg(data.error||"เกิดข้อผิดพลาด",false);
  };

  const handleToggle = async (promotionId:string) => {
    setToggling(promotionId);
    const res = await fetch("/api/admin/promotions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({promotionId}) });
    const data = await res.json();
    if (res.ok) {
      setPromotions(prev=>prev.map(p=>p.id===promotionId?{...p,status:data.status}:p));
      showMsg(data.status==="ACTIVE"?"เปิดโปรโมชั่นแล้ว ✓":"ปิดโปรโมชั่นแล้ว",true);
    } else showMsg(data.error||"เกิดข้อผิดพลาด",false);
    setToggling(null);
  };

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#111827",margin:0}}>🎁 จัดการโปรโมชั่น</h1>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",borderRadius:12,padding:"10px 16px",border:"1px solid #e5e7eb"}}>
          <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>ระบบโปรโมชั่น:</span>
          <span style={{fontSize:13,fontWeight:700,color:systemEnabled?"#059669":"#9ca3af"}}>
            {systemEnabled===null?"...":systemEnabled?"เปิดอยู่":"ปิดอยู่"}
          </span>
          <button onClick={toggleSystem} disabled={togglingSystem||systemEnabled===null}
            style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:systemEnabled?"#10b981":"#d1d5db",position:"relative",transition:"background 0.2s",opacity:togglingSystem?0.5:1}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:systemEnabled?27:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </button>
        </div>
      </div>

      {systemEnabled===false&&(
        <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:14,color:"#92400e"}}>
          ⚠️ <strong>ระบบโปรโมชั่นปิดอยู่</strong> — ผู้ใช้จะไม่เห็นหน้า /promotions และเมนูในทุกที่
        </div>
      )}

      <div style={{display:"flex",gap:4,marginBottom:24,background:"#f3f4f6",borderRadius:10,padding:4,width:"fit-content",flexWrap:"wrap"}}>
        {STATUS_TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,background:tab===t?"#fff":"transparent",color:tab===t?"#059669":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.2s"}}>
            {STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:60,color:"#6b7280"}}>กำลังโหลด...</div>
      ):promotions.length===0?(
        <div style={{textAlign:"center",padding:60,color:"#6b7280",background:"#fff",borderRadius:16}}>
          ไม่มีโปรโมชั่นในสถานะ "{STATUS_LABELS[tab]}"
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {promotions.map(p=>(
            <div key={p.id} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",opacity:p.status==="INACTIVE"?0.65:1,transition:"opacity 0.2s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                  {p.business.logoUrl?<img src={p.business.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🏪"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{p.title}</div>
                  <div style={{fontSize:13,color:"#6b7280",marginBottom:6}}>
                    {p.business.businessName}
                    {p.place&&<> · 📍 <a href={`/place/${p.place.slug}`} target="_blank" rel="noreferrer" style={{color:"#2563eb",textDecoration:"none",fontWeight:600}}>{p.place.title}</a></>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {p.discount&&<span style={{background:"#fce7f3",color:"#be185d",borderRadius:12,padding:"2px 10px",fontSize:12,fontWeight:600}}>{p.discount}</span>}
                    <span style={{background:"#f3f4f6",color:"#6b7280",borderRadius:12,padding:"2px 10px",fontSize:12}}>
                      {new Date(p.startDate).toLocaleDateString("th-TH")} – {new Date(p.endDate).toLocaleDateString("th-TH")}
                    </span>
                    <span style={{borderRadius:12,padding:"2px 10px",fontSize:12,fontWeight:600,background:p.status==="ACTIVE"?"#d1fae5":p.status==="PENDING"?"#fef3c7":p.status==="INACTIVE"?"#f3f4f6":"#fee2e2",color:p.status==="ACTIVE"?"#059669":p.status==="PENDING"?"#b45309":p.status==="INACTIVE"?"#6b7280":"#dc2626"}}>
                      {STATUS_LABELS[p.status]||p.status}
                    </span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  {p.status==="PENDING"&&(
                    <>
                      <button onClick={()=>handleReview(p.id,"APPROVE")} style={{background:"#10b981",color:"#fff",border:"none",padding:"8px 14px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>อนุมัติ</button>
                      <button onClick={()=>handleReview(p.id,"REJECT")} style={{background:"#fee2e2",color:"#dc2626",border:"none",padding:"8px 14px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>ปฏิเสธ</button>
                    </>
                  )}
                  {(p.status==="ACTIVE"||p.status==="INACTIVE")&&(
                    <button onClick={()=>handleToggle(p.id)} disabled={toggling===p.id}
                      style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:p.status==="ACTIVE"?"#10b981":"#d1d5db",position:"relative",flexShrink:0,transition:"background 0.2s",opacity:toggling===p.id?0.5:1}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:p.status==="ACTIVE"?27:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                    </button>
                  )}
                </div>
              </div>
              {p.condition&&<div style={{marginTop:10,fontSize:13,color:"#6b7280",background:"#f9fafb",borderRadius:8,padding:"8px 12px"}}>เงื่อนไข: {p.condition}</div>}
            </div>
          ))}
        </div>
      )}
      {toast&&<Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}
    </div>
  );
}
