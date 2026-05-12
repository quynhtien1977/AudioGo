import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Play, Trash2, Copy, Zap, Trophy, ArrowLeft, RefreshCw, Loader2, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const mkIcon = c => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${c}.png`,
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const ICONS = { gold: mkIcon("gold"), green: mkIcon("green"), red: mkIcon("red"), blue: mkIcon("blue"), violet: mkIcon("violet") };
const DEV_COLORS = ["gold","blue","violet","green","red"];
const POI_NAMES = ["A","B","C","D","E","F","G"];
const DEFAULT = { lat: 10.7769, lon: 106.7009 };

const SCENARIOS = [
  { id:"mix",       label:"Hỗn hợp",         desc:"Priority & audio ngẫu nhiên — thể hiện cả 3 tiers" },
  { id:"same_prio", label:"Cùng Priority",    desc:"Tất cả cùng rank → Audio offline quyết định (Tier 2)" },
  { id:"same_all",  label:"Cùng P + Audio",   desc:"Cùng rank & cùng audio → Khoảng cách quyết định (Tier 3)" },
  { id:"prio_wins", label:"Priority rõ ràng", desc:"1 POI P=3, còn lại P=1 → Tier 1 luôn thắng" },
];

function haversineM(la1,lo1,la2,lo2){
  const R=6371000,r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;
  const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ── Sinh POI BẢO ĐẢM device nằm trong vùng giao ─────────────────────────────
// Chiến lược: đặt tâm POI theo vòng tròn quanh device, radius > khoảng cách tâm POI → device
function generatePois(devices, poiCount, scenario) {
  const cLat = devices.reduce((s,d)=>s+d.lat,0)/devices.length;
  const cLon = devices.reduce((s,d)=>s+d.lon,0)/devices.length;
  const maxDev = Math.max(1,...devices.map(d=>haversineM(cLat,cLon,d.lat,d.lon)));

  return Array.from({length: poiCount}, (_,i) => {
    const angle = (2*Math.PI*i)/poiCount;
    let priority, hasLocalAudio, ctrDist;

    switch(scenario){
      case "same_prio":
        // Cùng priority → chỉ 1 POI có audio=true, còn lại false → Tier 2 luôn quyết định
        priority = 2;
        hasLocalAudio = (i === 0); // chỉ POI đầu tiên có audio
        ctrDist = 90;
        break;
      case "same_all":
        // Cùng priority + audio → phân biệt bằng khoảng cách → Tier 3 quyết định
        // Vary ctrDist để tạo chênh lệch khoảng cách thực sự
        priority = 2;
        hasLocalAudio = true;
        ctrDist = 60 + i * 20; // POI gần nhất (i=0, dist=60m) sẽ thắng
        break;
      case "prio_wins":
        priority = (i === 0) ? 3 : 1; // 1 POI P=3, còn lại P=1
        hasLocalAudio = Math.random() > .5;
        ctrDist = 90;
        break;
      default: // mix
        priority = Math.floor(Math.random()*3)+1;
        hasLocalAudio = Math.random() > .5;
        ctrDist = 90;
    }

    const radius = Math.round(Math.max(200, ctrDist + maxDev + 60));  // int for C# deserialization
    const dLat = (ctrDist/111320)*Math.cos(angle);
    const dLon = (ctrDist/(111320*Math.cos(cLat*Math.PI/180)))*Math.sin(angle);
    return { id:`fp-${i}`, name:`POI ${POI_NAMES[i]??i+1}`, lat:cLat+dLat, lon:cLon+dLon, radius, priority, hasLocalAudio };
  });
}

// resolveConflict đã được chuyển sang backend C# — frontend chỉ sinh data test


function MapClicker({cb}){ useMapEvents({click:e=>cb(e.latlng.lat,e.latlng.lng)}); return null; }
function ts(){ return new Date().toLocaleTimeString("vi-VN",{hour12:false}); }
const LC={ header:"text-pink-400 font-bold", step:"text-blue-400 font-semibold",
           winner:"text-emerald-400 font-bold", loser:"text-red-400",
           trace:"text-gray-400", warn:"text-amber-400", info:"text-gray-600" };

export default function GeofenceSimulatorPage(){
  const nav = useNavigate();
  const [devCount,  setDevCount]  = useState(3);
  const [scenario,  setScenario]  = useState("mix");
  const [devices,   setDevices]   = useState([]);
  const [fakePois,  setFakePois]  = useState([]);
  const [results,   setResults]   = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [running,   setRunning]   = useState(false);
  const [phase,     setPhase]     = useState("IDLE");
  const logRef = useRef(null);

  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; },[logs]);
  useEffect(()=>()=>{ setFakePois([]); setResults([]); },[]);

  const addLog = useCallback((type,msg)=> setLogs(p=>[...p,{ts:ts(),type,msg}]),[]);

  const reset = ()=>{ setDevices([]); setFakePois([]); setResults([]); setLogs([]); setPhase("IDLE"); };

  const changeDevCount = n => { setDevCount(n); reset();
    setLogs([{ts:ts(),type:"info",msg:`Số thiết bị: ${n}. Click map để đặt vị trí.`}]);
    setPhase("PLACING");
  };

  const changeScenario = s => { setScenario(s); setFakePois([]); setResults([]); setLogs([]); };

  const handleMapClick = (lat,lon) => {
    if(phase==="DONE"||devices.length>=devCount) return;
    const next=[...devices,{lat,lon}];
    setDevices(next);
    addLog("trace",`📱 Device ${next.length} → (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
    if(next.length===devCount){ setPhase("READY"); addLog("info",`✅ Đủ ${devCount} thiết bị. Nhấn Simulate.`); }
  };

  const simulate = async () => {
    if(devices.length<devCount){ toast.error(`Cần đặt đủ ${devCount} thiết bị`); return; }
    setRunning(true); setPhase("RUNNING"); setFakePois([]); setResults([]);
    const sc = SCENARIOS.find(s=>s.id===scenario);
    addLog("header",`══ SIMULATE | ${devCount} thiết bị | Kịch bản: ${sc.label} ══`);
    addLog("info", sc.desc);
    addLog("info","⚡ Gọi backend C# — chạy logic thực tế, không phải JS copy");

    const poiCount = devCount + 2;
    addLog("step",`⚙ Sinh ${poiCount} fake POI bao quanh centroid...`);
    const pois = generatePois(devices, poiCount, scenario);
    setFakePois(pois);
    await new Promise(r=>setTimeout(r,200));
    pois.forEach(p=> addLog("trace",`  📍 ${p.name}: P=${p.priority} R=${p.radius}m audio=${p.hasLocalAudio?"✓":"✗"}`));

    // Gửi từng device lên backend C# với toàn bộ fake POI
    const allRes=[];
    for(let i=0;i<devices.length;i++){
      const d=devices[i];
      addLog("header",`── Device ${i+1} (${d.lat.toFixed(4)},${d.lon.toFixed(4)}) ──`);
      addLog("step","→ POST /cms/debug/geofence-simulate (C# backend)");
      try {
        const { data } = await apiClient.post("/cms/debug/geofence-simulate", {
          latitude:   d.lat,
          longitude:  d.lon,
          customPois: pois.map(p => ({
            poiId:            p.id,
            name:             p.name,
            latitude:         p.lat,
            longitude:        p.lon,
            activationRadius: Math.round(p.radius),   // must be int
            priority:         Math.round(p.priority), // must be int
            hasLocalAudio:    Boolean(p.hasLocalAudio),
          }))
        });

        // Log từng dòng trace của C# backend
        (data.sortingTrace || []).forEach(line => {
          const type = line.includes("WINNER") ? "winner"
                     : line.includes("LOSER")  ? "loser"
                     : line.includes("Bước")   ? "step"
                     : line.includes("⚡") || line.includes("🗄") ? "info"
                     : "trace";
          addLog(type, line);
        });

        const candidates = (data.candidatePois || []).map(c => ({
          id: c.poiId, name: c.name, priority: c.priority,
          dist: c.distanceMeters, hasLocalAudio: c.hasLocalAudio,
          rank: c.rank, inCooldown: c.inCooldown,
        }));
        const winner = data.winner ? candidates.find(c=>c.id===data.winner.poiId) ?? null : null;
        allRes.push({ deviceIdx:i, winner, candidates, decisionTier: data.winner?.decisionTier });

      } catch(err) {
        const msg = err.response?.data?.message || err.message;
        addLog("warn",`  ⚠ Lỗi backend: ${msg}`);
        allRes.push({ deviceIdx:i, winner:null, candidates:[] });
      }
      await new Promise(r=>setTimeout(r,120));
    }
    setResults(allRes);
    addLog("header",`══ KẾT THÚC — ${allRes.filter(r=>r.winner).length}/${devCount} có winner ══`);
    setPhase("DONE"); setRunning(false);
    toast.success("Simulation hoàn thành!");
  };

  const copyLog=()=>{ navigator.clipboard.writeText(logs.map(l=>`[${l.ts}] ${l.msg}`).join("\n")); toast.success("Đã copy"); };
  const rem = devCount-devices.length;

  return (
    /* ── Root: h-screen overflow-hidden để giữ layout cố định ── */
    <div className="flex flex-col overflow-hidden" style={{height:"100vh"}}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={()=>nav(-1)} className="flex items-center gap-1.5 text-pink-600 hover:text-pink-700 text-sm font-medium">
            <ArrowLeft size={16}/> Quay lại
          </button>
          <div className="w-px h-5 bg-gray-200"/>
          <Zap size={17} className="text-pink-500"/>
          <span className="font-bold text-gray-900">Giả lập tranh chấp</span>
          <span className="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full">Admin Debug</span>
        </div>
        <div className="flex gap-2">
          <button onClick={simulate} disabled={running||devices.length<devCount}
            className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            {running?<Loader2 size={14} className="animate-spin"/>:<Play size={14}/>}
            {running?"Đang chạy...":"Simulate"}
          </button>
          <button onClick={reset} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm">
            <RefreshCw size={13}/> Reset
          </button>
        </div>
      </div>

      {/* Body — flex-1 min-h-0 để các con scroll độc lập */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Số thiết bị */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Số thiết bị</p>
            <div className="flex gap-2">
              {[1,3,5].map(n=>(
                <button key={n} onClick={()=>changeDevCount(n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition
                    ${devCount===n?"bg-pink-600 text-white border-pink-600":"border-gray-200 text-gray-600 hover:border-pink-300"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Kịch bản */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Kịch bản tranh chấp</p>
            {SCENARIOS.map(s=>(
              <label key={s.id} className={`flex items-start gap-2.5 mb-2 p-2.5 rounded-lg border cursor-pointer transition
                ${scenario===s.id?"border-pink-300 bg-pink-50":"border-gray-100 hover:border-pink-200"}`}>
                <input type="radio" name="scenario" value={s.id} checked={scenario===s.id}
                  onChange={()=>changeScenario(s.id)} className="mt-0.5 accent-pink-600"/>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Devices */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thiết bị</p>
            {phase==="IDLE"&&<p className="text-xs text-gray-400 italic">Chọn số thiết bị trước</p>}
            {Array.from({length:devCount},(_,i)=>{
              const d=devices[i], res=results.find(r=>r.deviceIdx===i);
              return (
                <div key={i} className={`flex items-start gap-2 py-1.5 ${!d?"opacity-40":""}`}>
                  <Smartphone size={13} className="text-gray-400 mt-0.5 shrink-0"/>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-800">Device {i+1}</span>
                    {d?<p className="text-xs text-gray-500 font-mono">{d.lat.toFixed(4)},{d.lon.toFixed(4)}</p>
                      :<p className="text-xs text-gray-300">chưa đặt</p>}
                    {res&&(res.winner
                      ?<p className="text-xs text-emerald-600 font-semibold">🏆 {res.winner.name}</p>
                      :<p className="text-xs text-red-400">Không có winner</p>)}
                  </div>
                </div>
              );
            })}
            {phase==="PLACING"&&rem>0&&(
              <p className="text-xs text-pink-500 mt-1.5">Click map để đặt {rem} thiết bị nữa</p>
            )}
          </div>

          {/* Fake POIs */}
          {fakePois.length>0&&(
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fake POI (test only)</p>
              {fakePois.map(p=>(
                <div key={p.id} className="text-xs py-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${results.some(r=>r.winner?.id===p.id)?"bg-green-400":"bg-red-400"}`}/>
                  <span className="font-semibold text-gray-700">{p.name}</span>
                  <span className="text-gray-400">P={p.priority} R={p.radius}m {p.hasLocalAudio?"🔊":""}</span>
                </div>
              ))}
              <p className="text-xs text-gray-300 mt-2 italic">Tự xóa khi Reset/rời trang</p>
            </div>
          )}
        </div>

        {/* CENTER: Map + Table */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Map — flex-1 min-h-0 */}
          <div className="flex-1 min-h-0 relative">
            <MapContainer center={[DEFAULT.lat,DEFAULT.lon]} zoom={15} style={{height:"100%",width:"100%"}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap"/>
              <MapClicker cb={handleMapClick}/>
              {devices.map((d,i)=>(
                <Marker key={`d${i}`} position={[d.lat,d.lon]} icon={ICONS[DEV_COLORS[i]]??ICONS.gold}>
                  <Popup><b>📱 Device {i+1}</b><br/>{d.lat.toFixed(5)}, {d.lon.toFixed(5)}<br/>
                    {results[i]?.winner?`🏆 ${results[i].winner.name}`:"Chưa simulate"}</Popup>
                </Marker>
              ))}
              {fakePois.map((p)=>{
                const isW=results.some(r=>r.winner?.id===p.id);
                const col=isW?"#10b981":"#ef4444";
                return (
                  <div key={p.id}>
                    <Circle center={[p.lat,p.lon]} radius={p.radius}
                      pathOptions={{color:col,fillColor:col,fillOpacity:0.13,weight:2}}/>
                    <Marker position={[p.lat,p.lon]} icon={isW?ICONS.green:ICONS.red}>
                      <Popup><b>{p.name}</b><br/>P={p.priority} R={p.radius}m<br/>
                        Audio={p.hasLocalAudio?"✓":"✗"}<br/>
                        {isW&&<span style={{color:"#059669"}}>🏆 Winner</span>}</Popup>
                    </Marker>
                  </div>
                );
              })}
            </MapContainer>
            {phase==="PLACING"&&(
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-pink-600 text-white text-xs px-4 py-2 rounded-full shadow font-semibold pointer-events-none">
                Click map → Device {devices.length+1}/{devCount}
              </div>
            )}
          </div>

          {/* Candidates table — chiều cao cố định, scroll riêng */}
          {results.length>0&&(
            <div className="shrink-0 bg-white border-t border-gray-200 overflow-auto" style={{maxHeight:"176px"}}>
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wide">
                  <tr>
                    {["Device","Rank","POI","Priority","Dist","Audio","Status"].map(h=>(
                      <th key={h} className="px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.flatMap(r=>
                    r.candidates.length===0
                      ?[<tr key={`d${r.deviceIdx}-e`}><td className="px-3 py-2 font-semibold text-gray-600">D{r.deviceIdx+1}</td>
                          <td colSpan={6} className="px-3 py-2 text-gray-400 italic">Không có POI trong vùng phủ</td></tr>]
                      :r.candidates.map((c,ci)=>{
                          const iW=r.winner?.id===c.id;
                          return (
                            <tr key={`d${r.deviceIdx}-${c.id}`} className={iW?"bg-green-50":"hover:bg-gray-50"}>
                              {ci===0&&<td rowSpan={r.candidates.length} className="px-3 py-2 font-bold text-gray-700 align-top border-r border-gray-100">D{r.deviceIdx+1}</td>}
                              <td className="px-3 py-2 font-mono">#{c.rank}</td>
                              <td className="px-3 py-2 font-semibold text-gray-900">{c.name}</td>
                              <td className="px-3 py-2"><span className="bg-pink-50 text-pink-700 border border-pink-100 px-1.5 py-0.5 rounded">P={c.priority}</span></td>
                              <td className="px-3 py-2 font-mono">{c.dist}m</td>
                              <td className="px-3 py-2">{c.hasLocalAudio?"🔊":"—"}</td>
                              <td className="px-3 py-2">{iW?<span className="text-emerald-600 font-bold flex items-center gap-1"><Trophy size={11}/>WIN</span>:<span className="text-gray-400">lose</span>}</td>
                            </tr>
                          );
                        })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Logrunner — scroll riêng, không ảnh hưởng layout */}
        <div className="w-96 shrink-0 flex flex-col overflow-hidden bg-gray-950 border-l border-gray-800">
          {/* Terminal titlebar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                <div className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <span className="text-gray-500 text-xs font-mono ml-1">geofence-simulator</span>
            </div>
            <div className="flex gap-3">
              <button onClick={copyLog} className="text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1"><Copy size={11}/>copy</button>
              <button onClick={()=>setLogs([])} className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1"><Trash2 size={11}/>clear</button>
            </div>
          </div>
          {/* Log body — flex-1 min-h-0 + overflow-y-auto: scroll riêng hoàn toàn */}
          <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
            {logs.length===0&&<p className="text-gray-600 italic text-center mt-8">Chọn kịch bản → đặt thiết bị → Simulate</p>}
            {logs.map((l,i)=>(
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-gray-600 shrink-0">[{l.ts}]</span>
                <span className={LC[l.type]??"text-gray-300"}>{l.msg}</span>
              </div>
            ))}
            {running&&<div className="flex items-center gap-2 text-gray-600 mt-1"><Loader2 size={11} className="animate-spin"/><span>processing...</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
