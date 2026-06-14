import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Navigation2, Sparkles, Map as MapIcon, Home, User, Plus, Check } from "lucide-react";
import { 
  QUESTIONS, calculateDNA, getTop3, lookupPersona, buildRuleInstructions, 
  MOCK_DASHBOARD_PLACES, FALLBACK_PLACES, FALLBACK_MULTIDAY_PLACES 
} from "./data";

const screenTransition = { initial: { y: "10%", opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: "-10%", opacity: 0 }, transition: { duration: 0.3, ease: "easeOut" } };

export default function App() {
  const [screen, setScreen] = useState("S1_SPLASH");
  const [answers, setAnswers] = useState<{questionNum: number, selectedOption: string}[]>([]);
  const [dnaResult, setDnaResult] = useState<any>(null);
  const [persona, setPersona] = useState<any>(null);
  const [personaDesc, setPersonaDesc] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");
  
  const [savedPlaces, setSavedPlaces] = useState<any[]>(() => {
    const local = localStorage.getItem("sole_saved");
    return local ? JSON.parse(local) : [];
  });

  const [savedItineraries, setSavedItineraries] = useState<any[]>(() => {
    const local = localStorage.getItem("sole_itineraries");
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem("sole_saved", JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem("sole_itineraries", JSON.stringify(savedItineraries));
  }, [savedItineraries]);

  const toggleSave = (place: any) => {
    if (!place) return;
    const exists = savedPlaces.find(p => p.id === place.id);
    if (exists) {
      setSavedPlaces(savedPlaces.filter(p => p.id !== place.id));
    } else {
      setSavedPlaces([...savedPlaces, place]);
    }
  };

  const isSaved = (placeId: string) => savedPlaces.some(p => p.id === placeId);

  useEffect(() => {
    if (screen === "S1_SPLASH") {
      const timer = setTimeout(() => setScreen("S3_QUIZ_INTRO"), 1500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  return (
    <div className="w-full max-w-[480px] h-[100dvh] mx-auto relative overflow-hidden bg-bg-base text-on-surface shadow-2xl">
      <AnimatePresence mode="wait">
        {screen === "S1_SPLASH" && <S1_Splash key="s1" />}
        {screen === "S3_QUIZ_INTRO" && <S3_QuizIntro key="s3" onNext={() => setScreen("S4_QUIZ")} />}
        {screen === "S4_QUIZ" && <S4_Quiz key="s4" onComplete={(ans) => {
          setAnswers(ans);
          const dna = calculateDNA(ans);
          setDnaResult(dna);
          const top3s = getTop3(dna.normalized);
          const p = lookupPersona(top3s.map(t => t.axis), dna.normalized);
          setPersona(p);
          setScreen("S5_PERSONA");
        }} />}
        {screen === "S5_PERSONA" && <S5_Persona key="s5" dnaResult={dnaResult} persona={persona} onNext={() => setScreen("MAIN_APP")} setExtDesc={setPersonaDesc} onReQuiz={() => {
            setScreen("S3_QUIZ_INTRO");
            setAnswers([]);
        }} />}
        {screen === "MAIN_APP" && (
           <motion.div key="main" {...screenTransition} className="w-full h-full relative flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                 <AnimatePresence mode="wait">
                    {activeTab === "home" && <S6_Dashboard key="home" persona={persona} onPrompt={() => setActiveTab("search")} />}
                    {activeTab === "search" && <S8_Prompt key="search" dnaResult={dnaResult} onResult={(res) => {
                       setItinerary(res);
                       setScreen("S9_ITINERARY");
                    }} />}
                    {activeTab === "profile" && <S11_Profile key="profile" dnaResult={dnaResult} persona={persona} personaDesc={personaDesc} onReQuiz={() => {
                        setAnswers([]);
                        setScreen("S3_QUIZ_INTRO");
                    }} savedPlaces={savedPlaces} savedItineraries={savedItineraries} />}
                 </AnimatePresence>
              </div>
              <BottomNav activeTab={activeTab} onChange={setActiveTab} />
           </motion.div>
        )}
        {screen === "S9_ITINERARY" && <S9_Itinerary key="s9" result={itinerary} onPlaceSelect={(p) => {
          setSelectedPlace(p);
          setScreen("S10_PLACE_DETAIL");
        }} onBack={() => { setScreen("MAIN_APP"); setActiveTab("search"); }} 
           onSave={() => setSavedItineraries([...savedItineraries, itinerary])} 
           isSaved={() => savedItineraries.some(i => i === itinerary)}
        />}
        {screen === "S10_PLACE_DETAIL" && <S10_PlaceDetail key="s10" place={selectedPlace} onBack={() => setScreen(itinerary ? "S9_ITINERARY" : "MAIN_APP")} toggleSave={() => toggleSave(selectedPlace)} isSaved={isSaved(selectedPlace?.id)} />}
      </AnimatePresence>
    </div>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: string, onChange: (tab: string) => void }) {
  const navItems = [
    { id: "home", icon: Home, label: "Trang chủ" },
    { id: "search", icon: Search, label: "Tìm Tọa Độ" },
    { id: "profile", icon: User, label: "DNA Của Bạn" }
  ];

  return (
      <div className="w-full h-[88px] bg-surface-high border-t border-outline flex justify-between items-center px-4 pb-4 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] z-40 relative">
        {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => onChange(item.id)} className={`flex-1 flex flex-col items-center gap-1.5 transition-colors ${isActive ? 'text-acid-green drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]' : 'text-on-surface-dim hover:text-on-surface'}`}>
                  <Icon size={24} />
                  <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-acid-green' : 'text-on-surface-dim'}`}>{item.label}</span>
              </button>
            );
        })}
      </div>
  );
}

function S1_Splash() {
  return (
    <motion.div {...screenTransition} className="flex flex-col items-center justify-center w-full h-full">
      <motion.h1 
        animate={{ filter: ["drop-shadow(0 0 10px rgba(189,0,255,0.4))", "drop-shadow(0 0 25px rgba(189,0,255,0.8))", "drop-shadow(0 0 10px rgba(189,0,255,0.4))"] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[48px] font-extrabold leading-[56px] tracking-[-0.02em] text-white"
      >
        SOLE
      </motion.h1>
      <p className="text-on-surface-dim text-[14px]">Soul Map for Gen Z</p>
      <motion.div 
        animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mt-8"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#00FFA3" strokeWidth="2" strokeDasharray="2 6" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

const S3_QuizIntro: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return (
    <motion.div {...screenTransition} className="flex flex-col items-center justify-center w-full h-full p-6 text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative mb-12">
        <div className="w-[120px] h-[120px] rounded-full border border-[#00FFA3]/30" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-[#00FFA3] to-transparent origin-bottom" style={{ height: "60px" }} />
      </motion.div>
      <h2 className="text-[28px] font-bold leading-9 mb-4">Định vị tần số của bạn.</h2>
      <p className="text-[16px] text-on-surface-dim mb-8">Trả lời nhanh 10 câu để SOLE vẽ lại bộ gen không gian & ẩm thực của riêng bạn.</p>
      <div className="px-4 py-1 rounded-full bg-cyber-purple/15 text-cyber-purple text-[12px] font-bold uppercase tracking-widest mb-12">
        ⚡ Khoảng 2 phút
      </div>
      <div className="absolute bottom-8 left-6 right-6">
        <button onClick={onNext} className="w-full h-[56px] bg-acid-green text-acid-green-txt font-bold rounded-full neon-glow-acid">
          BẮT ĐẦU QUÉT
        </button>
      </div>
    </motion.div>
  );
}

const S4_Quiz: React.FC<{ onComplete: (ans: any[]) => void }> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{questionNum: number, selectedOption: string}[]>([]);
  
  const q = QUESTIONS[currentIdx];
  
  const handleSelect = (letter: string) => {
    const newAns = [...answers, { questionNum: q.num, selectedOption: letter }];
    setAnswers(newAns);
    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 300);
    } else {
      setTimeout(() => onComplete(newAns), 300);
    }
  };

  return (
    <motion.div {...screenTransition} className="flex flex-col w-full h-full p-6 pt-12">
      <div className="w-full h-1 bg-surface-high mb-8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-cyber-purple to-acid-green" initial={{ width: "0%" }} animate={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <div className="text-[12px] font-bold tracking-widest text-on-surface-dim uppercase mb-4">{currentIdx+1} / 10</div>
      <h2 className="text-[28px] font-bold leading-9 mb-8 min-h-[108px]">{q.question}</h2>
      
      <div className={`flex-1 overflow-y-auto hide-scrollbar pb-6 ${q.options.length > 4 ? 'grid grid-cols-2 gap-3 auto-rows-max' : 'flex flex-col gap-4'}`}>
        {q.options.map(opt => {
          const isSelected = answers.find(a => a.questionNum === q.num && a.selectedOption === opt.letter);
          return (
          <motion.div 
            key={opt.letter} 
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(opt.letter)}
            className={`w-full rounded-[24px] overflow-hidden relative cursor-pointer group transition-all duration-300 ${isSelected ? 'border-2 border-acid-green shadow-[inset_0_0_12px_rgba(0,255,163,0.25)] scale-[1.03]' : answers.length > currentIdx ? 'opacity-45' : ''}`}
            style={{ minHeight: q.options.length > 4 ? "180px" : "140px", display: "flex", alignItems: "flex-end" }}
          >
            <div className="absolute inset-0 bg-surface-high transition-transform duration-500 group-hover:scale-[1.02]">
              <img src={opt.img} alt={opt.label} className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>
            <div className="relative z-10 p-4 w-full">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[14px] font-bold mb-3 backdrop-blur-md">{opt.letter}</div>
               <p className={`font-bold leading-tight drop-shadow-md ${q.options.length > 4 ? 'text-[14px]' : 'text-[18px]'}`}>{opt.label}</p>
            </div>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}

const S5_Persona: React.FC<{ dnaResult: any, persona: any, onNext?: () => void, setExtDesc?: any, isProfile?: boolean, initialDesc?: any, onReQuiz?: () => void }> = ({ dnaResult, persona, onNext, setExtDesc, isProfile, initialDesc, onReQuiz }) => {
  const [desc, setDesc] = useState<any>(initialDesc || null);
  const [loading, setLoading] = useState(!initialDesc);

  useEffect(() => {
    if (initialDesc) {
      setDesc(initialDesc);
      setLoading(false);
      return;
    }

    const top3 = getTop3(dnaResult.normalized).map(t => `${t.axis}: ${t.score}`).join(', ');
    fetch("/api/gemini/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ normalizedDNA: dnaResult.normalized, personaName: persona.name, top3 })
    }).then(r => r.json()).then(data => {
      setDesc(data);
      if (setExtDesc && typeof setExtDesc === 'function') setExtDesc(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setDesc({ description: persona.tagline, superpower: "Bộ gen du lịch" });
      setLoading(false);
    });
  }, [dnaResult, persona, initialDesc, setExtDesc]);

  return (
    <motion.div {...screenTransition} className="flex flex-col items-center justify-center w-full h-full p-6 text-center relative pointer-events-none">
      {loading ? (
        <div className="flex flex-col items-center">
          <motion.div animate={{ rotate: 180 }} transition={{ duration: 1, repeat: Infinity }} className="mb-4">
             <div className="w-12 h-12 border-t-2 border-r-2 border-acid-green rounded-full shadow-[0_0_16px_rgba(0,255,163,0.4)]"></div>
          </motion.div>
          <p className="text-acid-green animate-pulse">Đang định vị tần số...</p>
        </div>
      ) : (
        <div className="w-full max-w-[340px] glass-panel rounded-3xl p-6 relative z-10 pointer-events-auto shadow-2xl" style={{ borderColor: persona.accentColor, borderWidth: '1px' }}>
          <div className="text-[12px] uppercase font-bold tracking-widest text-[#888888] mb-2">{desc?.superpower || "Bộ gen du lịch"}</div>
          <h2 className="text-[32px] font-extrabold leading-[40px] mb-4" style={{ color: persona.accentColor }}>{persona.name}</h2>
          <p className="text-[14px] text-on-surface leading-relaxed mb-8">{desc?.description || persona.tagline}</p>
          
          <div className="w-full h-[200px] flex items-center justify-center mb-8 relative">
              <svg viewBox="-50 -50 100 100" className="w-full h-full overflow-visible">
                  {Object.keys(dnaResult.normalized).map((axis, i, arr) => {
                     const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
                     const val = dnaResult.normalized[axis];
                     const radius = (val / 100) * 40;
                     const x = Math.cos(angle) * radius;
                     const y = Math.sin(angle) * radius;
                     return <circle key={axis} cx={x} cy={y} r="2" fill={persona.accentColor} />;
                  })}
                  <polygon 
                     points={Object.keys(dnaResult.normalized).map((axis, i, arr) => {
                        const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
                        const radius = (dnaResult.normalized[axis] / 100) * 40;
                        return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
                     }).join(" ")}
                     fill={persona.accentColor} fillOpacity="0.2" stroke={persona.accentColor} strokeWidth="1"
                  />
              </svg>
          </div>

          {!isProfile && onNext && (
            <button onClick={onNext} className="w-full h-[56px] rounded-full font-bold text-black" style={{ background: `linear-gradient(90deg, ${persona.accentColor}, #00FFA3)` }}>
              VÀO DASHBOARD
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

const S6_Dashboard: React.FC<{ persona: any, onPrompt: () => void }> = ({ persona, onPrompt }) => {
  return (
    <motion.div {...screenTransition} className="w-full h-full flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-20 pointer-events-none flex justify-between items-center bg-gradient-to-b from-bg-base to-transparent">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full neon-glow-purple" style={{ backgroundColor: persona.accentColor }} />
            <span className="font-bold text-[14px] uppercase tracking-wider">{persona.name}</span>
         </div>
         <div className="pointer-events-auto">
             <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center">
                <Search size={20} />
             </button>
         </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar pb-[120px]">
         {MOCK_DASHBOARD_PLACES.map((p, i) => (
           <div key={p.id} className="w-full h-full snap-start relative flex items-end">
              <div className="absolute inset-0">
                 <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent" />
              </div>
              <div className="relative z-10 p-6 w-full pb-[20px]">
                 <div className="flex justify-between items-end mb-4">
                    <div className="flex-1">
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {p.tags.map(t => <span key={t} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[12px] font-bold">{t}</span>)}
                        </div>
                        <h3 className="text-[28px] font-bold leading-tight drop-shadow-md pr-4">{p.name}</h3>
                        <p className="text-on-surface-dim mt-1 flex items-center gap-1 text-sm font-medium"><MapPin size={14}/> {p.distance}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="w-12 h-12 rounded-full border-2 border-cyber-purple flex items-center justify-center text-cyber-purple font-bold bg-bg-base/80 backdrop-blur-sm neon-glow-purple">
                            {p.matchScore}
                        </div>
                        <span className="text-[10px] text-cyber-purple font-bold tracking-widest">MATCH</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="absolute bottom-[24px] left-6 right-6 z-20">
         <button onClick={onPrompt} className="w-full h-[56px] glass-panel border border-outline rounded-full flex items-center px-4 gap-3 bg-[rgba(255,255,255,0.07)] backdrop-blur-[24px] shadow-lg">
             <Sparkles size={20} className="text-cyber-purple" />
             <span className="text-on-surface-dim flex-1 text-left font-medium">Hỏi SOLE tọa độ hôm nay...</span>
         </button>
      </div>
    </motion.div>
  );
}

const S8_Prompt: React.FC<{ dnaResult: any, onResult: (res: any) => void }> = ({ dnaResult, onResult }) => {
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [tripMode, setTripMode] = useState<"single" | "multiday">("single");
  const [totalDays, setTotalDays] = useState(3);
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [provinceCode, setProvinceCode] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");
  const [wardCode, setWardCode] = useState<string>("");

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then(res => res.json())
      .then(data => {
        setProvinces(data);
        // Default to TP.HCM if available
        const hcm = data.find((p: any) => p.name.includes("Hồ Chí Minh"));
        if(hcm) handleProvinceChange(String(hcm.code));
      })
      .catch(console.error);
  }, []);

  const handleProvinceChange = (code: string) => {
    setProvinceCode(code);
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);
    if (code) {
      fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []))
        .catch(console.error);
    }
  };

  const handleDistrictChange = (code: string) => {
    setDistrictCode(code);
    setWardCode("");
    setWards([]);
    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []))
        .catch(console.error);
    }
  };

  const handleSubmit = async () => {
    if(!input.trim() || !budget) return;
    setLoading(true);
    try {
      const bRI = buildRuleInstructions(dnaResult.normalized);
      
      const provinceObj = provinces.find(p => p.code === Number(provinceCode));
      const districtObj = districts.find(d => d.code === Number(districtCode));
      const wardObj = wards.find(w => w.code === Number(wardCode));
      
      const locationDataArgs = provinceObj ? { 
        province: provinceObj.name, 
        district: districtObj?.name || "", 
        ward: wardObj?.name || "" 
      } : null;

      const res = await fetch("/api/gemini/smart-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userInput: input, normalizedDNA: dnaResult.normalized, budget, buildRuleInstructionsText: bRI,
          tripMode, totalDays, location: locationDataArgs
        })
      });
      const data = await res.json();
      if (!res.ok) {
         console.error("API Error Status:", res.status, "Data:", data);
         onResult(tripMode === "multiday" ? FALLBACK_MULTIDAY_PLACES : FALLBACK_PLACES);
         setLoading(false);
         return;
      }
      if(data.places || data.days) {
         // Auto gen IDs
         if(data.places) data.places = data.places.map((p: any, i: number) => ({ ...p, id: p.id || `gemini_${Date.now()}_${i}`}));
         if(data.days) data.days.forEach((d: any) => d.places = d.places?.map((p: any, i: number) => ({ ...p, id: p.id || `gemini_md_${d.day}_${Date.now()}_${i}`})));
         onResult(data);
      } else {
         onResult(tripMode === "multiday" ? FALLBACK_MULTIDAY_PLACES : FALLBACK_PLACES); // fallback needs id too ideally
      }
    } catch(err) {
      console.error(err);
      onResult(tripMode === "multiday" ? FALLBACK_MULTIDAY_PLACES : FALLBACK_PLACES);
    }
    setLoading(false);
  };

  return (
    <motion.div {...screenTransition} className="w-full h-full bg-bg-base/95 backdrop-blur-2xl p-6 flex flex-col relative z-10 overflow-y-auto hide-scrollbar">
       <h2 className="text-[28px] font-bold mb-6 mt-4 leading-9 pt-4">Lên kế hoạch đi đâu?</h2>
       
       <div className="flex gap-2 mb-6">
          <button onClick={() => setTripMode("single")} className={`flex-1 p-3 rounded-xl border text-left transition-colors ${tripMode === "single" ? 'border-[#3b82f6] bg-[#EFF6FF] text-[#1A4B8C]' : 'border-outline bg-surface-high text-on-surface-dim'}`}>
             <span className="font-bold text-[14px] block mb-1">Đi trong ngày</span>
             <span className="text-[11px] block leading-tight">Bán kính ≤ 30km khu vực hiện tại.</span>
          </button>
          <button onClick={() => setTripMode("multiday")} className={`flex-1 p-3 rounded-xl border text-left transition-colors ${tripMode === "multiday" ? 'border-[#3b82f6] bg-[#EFF6FF] text-[#1A4B8C]' : 'border-outline bg-surface-high text-on-surface-dim'}`}>
             <span className="font-bold text-[14px] block mb-1">Đi dài ngày</span>
             <span className="text-[11px] block leading-tight">Địa điểm &gt; 100km, lịch cho đa ngày.</span>
          </button>
       </div>

       {tripMode === "multiday" && (
         <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-6 bg-surface-high border border-outline rounded-xl py-2 px-6">
               <button onClick={() => setTotalDays(Math.max(2, totalDays - 1))} className="text-on-surface-dim text-[24px] w-8 flex items-center justify-center">−</button>
               <div className="flex flex-col items-center w-12">
                  <span className="text-[24px] font-bold leading-noner">{totalDays}</span>
                  <span className="text-[10px] text-on-surface-dim">ngày</span>
               </div>
               <button onClick={() => setTotalDays(Math.min(14, totalDays + 1))} className="text-on-surface-dim text-[24px] w-8 flex items-center justify-center">+</button>
            </div>
         </div>
       )}

       {tripMode === "single" && (
         <div className="mb-6">
            <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-dim mb-4">Khu vực</p>
            <div className="flex items-center gap-2">
               <div className="relative flex-1">
                  <select value={provinceCode} onChange={e => handleProvinceChange(e.target.value)} className="w-full h-10 bg-surface-high border border-outline rounded-lg px-3 text-on-surface text-[12px] outline-none appearance-none font-bold">
                     <option value="">Chọn Tỉnh/Thành</option>
                     {provinces.map(p => <option key={p.code} value={p.code}>{p.name.replace("Thành phố ", "").replace("Tỉnh ", "")}</option>)}
                  </select>
               </div>
               <span className="text-on-surface-dim">›</span>
               <div className="relative flex-1">
                  <select value={districtCode} onChange={e => handleDistrictChange(e.target.value)} className="w-full h-10 bg-surface-high border border-outline rounded-lg px-3 text-on-surface text-[12px] outline-none appearance-none font-bold">
                     <option value="">Quận/Huyện</option>
                     {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
               </div>
               <span className="text-on-surface-dim">›</span>
               <div className="relative flex-1">
                  <select value={wardCode} onChange={e => setWardCode(e.target.value)} className="w-full h-10 bg-surface-high border border-outline rounded-lg px-3 text-on-surface text-[12px] outline-none appearance-none font-bold">
                     <option value="">Phường/Xã</option>
                     {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
               </div>
            </div>
         </div>
       )}

       <div className="mb-8">
          <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-dim mb-4">Nhu cầu của bạn</p>
          <textarea 
            onClick={(e) => { if (e.target instanceof HTMLTextAreaElement) e.target.focus(); }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="VD: Tìm chỗ ngồi yên tĩnh, wifi mạnh, có cà phê sữa đá..."
            className="w-full h-24 bg-transparent border-none text-[20px] outline-none resize-none placeholder:text-on-surface-dim/40 focus:ring-0 p-0 text-on-surface leading-8"
          />
       </div>

       <div className="mt-auto">
          <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-dim mb-4">Tổng ngân sách (VNĐ)</p>
          <input 
             type="number"
             value={budget}
             onChange={e => setBudget(e.target.value ? Number(e.target.value) : "")}
             placeholder="VD: 2000000"
             className="w-full h-14 bg-surface-high border border-outline rounded-xl px-4 text-[20px] font-bold outline-none mb-3"
          />
          {budget !== "" && typeof budget === "number" && (
             <div className="text-acid-green font-bold text-[14px] mb-3">{budget.toLocaleString('vi-VN')} đ</div>
          )}
          <div className="flex flex-wrap gap-2">
             {[500000, 1000000, 2000000, 5000000, 10000000].map(val => (
                <button key={val} onClick={() => setBudget(val)} className="px-3 py-1.5 rounded-full border border-outline text-[12px] font-bold hover:bg-surface transition-colors bg-surface-high whitespace-nowrap">
                   {val === 500000 ? "500K" : val === 1000000 ? "1 triệu" : val === 2000000 ? "2 triệu" : val === 5000000 ? "5 triệu" : "10 triệu+"}
                </button>
             ))}
          </div>
       </div>

       <div className="mt-10 pt-4 pb-6">
          <button onClick={handleSubmit} disabled={loading || !input.trim() || !budget} className="w-full h-[56px] bg-acid-green text-acid-green-txt font-bold rounded-full neon-glow-acid flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed uppercase">
             {loading ? "ĐANG TÌM TỌA ĐỘ..." : "QUÉT TỌA ĐỘ"}
          </button>
       </div>
    </motion.div>
  );
}

const S9_Itinerary: React.FC<{ result: any, onBack: () => void, onPlaceSelect: (p: any) => void, onSave: () => void, isSaved: () => boolean }> = ({ result, onBack, onPlaceSelect, onSave, isSaved }) => {
  const [activeDay, setActiveDay] = useState(1);

  if (!result) return null;

  const isMultiday = result.tripMode === "multiday" || result.days;
  const places = isMultiday ? (result.days?.find((d:any) => d.day === activeDay)?.places || []) : (result.places || []);
  const aiVibe = result.aiVibe || "";
  const routeNote = isMultiday ? "" : result.routeNote;

  const totalBudget = result.totalEstimatedCost;
  const bd = result.budgetBreakdown;

  return (
    <motion.div {...screenTransition} className="w-full h-full bg-bg-base flex flex-col">
       <div className="p-6 pt-12 glass-panel flex items-center justify-between border-b-0 shrink-0">
          <button onClick={onBack} className="text-cyber-purple font-bold flex items-center gap-1 text-[14px] uppercase tracking-wider">
             <span className="text-lg leading-none shrink-0 mb-[2px]">←</span> Trở lại
          </button>
          <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Đã copy link chia sẻ!");
                }}
                className="text-[12px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-outline text-on-surface hover:bg-surface transition-colors"
               >
                  Share
              </button>
              <button 
                onClick={onSave}
                disabled={isSaved()}
                className={`text-[12px] uppercase tracking-widest font-bold px-3 py-1 rounded-full transition-colors ${isSaved() ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/50' : 'border border-outline text-on-surface hover:bg-surface'}`}
              >
                  {isSaved() ? "Đã Lưu" : "Lưu Plan"}
              </button>
          </div>
       </div>

       {isMultiday && result.days && (
         <div className="w-full overflow-x-auto hide-scrollbar border-b border-outline shrink-0 flex">
            {result.days.map((d: any) => (
                <button 
                  key={d.day} 
                  onClick={() => setActiveDay(d.day)}
                  className={`px-6 py-4 font-bold text-[14px] whitespace-nowrap border-b-2 transition-colors ${activeDay === d.day ? 'border-acid-green text-acid-green' : 'border-transparent text-on-surface-dim'}`}
                >
                   Ngày {d.day}
                </button>
            ))}
         </div>
       )}

       <div className="px-6 py-4 bg-surface text-[14px] italic text-on-surface border-y border-outline mb-4 shrink-0">"{aiVibe}"</div>
       
       <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-24 relative pt-2">
          <div className="absolute left-[39px] top-6 bottom-12 w-[1px] bg-[#514255]" />
          
          {places && places.map((place: any, index: number) => (
             <div key={index} className="relative z-10 flex gap-4 mb-6 cursor-pointer group" onClick={() => onPlaceSelect(place)}>
                <div className="w-3.5 h-3.5 mt-6 rounded-full bg-cyber-purple neon-glow-purple border border-bg-base shrink-0 ml-[1px]" />
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-outline group-hover:border-cyber-purple/50 transition-colors bg-surface">
                   <div className="flex justify-between items-start mb-2 gap-2">
                       <h3 className="font-bold text-[18px] leading-tight flex-1">{place.name}</h3>
                       <div className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple rounded-md text-[12px] font-bold shrink-0">{place.matchScore}%</div>
                   </div>
                   <p className="text-[12px] text-on-surface-dim mb-3 font-medium">{place.category} • {place.estimatedStay}</p>
                   <p className="text-[14px] text-on-surface mb-4 leading-relaxed">"{place.whyMatch}"</p>
                   <div className="flex gap-2 flex-wrap">
                       {place.tags?.map((t: string) => <span key={t} className="text-[10px] uppercase tracking-wider font-bold text-on-surface-dim bg-surface-high px-2 py-1 rounded-sm">{t}</span>)}
                   </div>
                </div>
             </div>
          ))}

          {isMultiday && result.days?.find((d:any) => d.day === activeDay)?.accommodation && (
             <div className="relative z-10 flex gap-4 mb-6 cursor-pointer group mt-8">
                <div className="w-3.5 h-3.5 mt-6 rounded-full bg-acid-green neon-glow-acid border border-bg-base shrink-0 ml-[1px]" />
                <div className="flex-1 bg-acid-green/10 rounded-2xl p-5 border border-acid-green/30">
                   <h3 className="font-bold text-[18px] leading-tight flex-1 mb-2">🏨 Nơi ở: {result.days.find((d:any) => d.day === activeDay).accommodation.name}</h3>
                   <p className="text-[14px] text-acid-green font-bold">{result.days.find((d:any) => d.day === activeDay).accommodation.pricePerNight?.toLocaleString('vi-VN')} đ / đêm</p>
                </div>
             </div>
          )}

          {routeNote && (
            <div className="glass-panel text-on-surface-dim rounded-xl p-4 mt-8 border border-outline flex gap-3 text-[14px] leading-relaxed ml-7 bg-surface">
                <Navigation2 size={18} className="shrink-0 mt-0.5 text-cyber-purple" />
                <p>{routeNote}</p>
            </div>
          )}

          {isMultiday && totalBudget && bd && (
             <div className="glass-panel rounded-2xl p-5 mt-8 border border-outline bg-surface">
                <h4 className="font-bold mb-4 text-[16px]">Dự toán: <span className="text-acid-green">{totalBudget.toLocaleString('vi-VN')} đ</span></h4>
                <div className="flex flex-col gap-3">
                   {[{label:"Ăn uống", k:"food"}, {label:"Di chuyển", k:"transport"}, {label:"Chỗ ở", k:"accommodation"}, {label:"Hoạt động", k:"activities"}].map(item => {
                      if (!bd[item.k]) return null;
                      const p = (bd[item.k] / totalBudget) * 100;
                      return (
                         <div key={item.k}>
                            <div className="flex justify-between text-[12px] mb-1 font-semibold">
                               <span className="text-on-surface-dim">{item.label}</span>
                               <span>{bd[item.k].toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
                               <div className="h-full bg-cyber-purple" style={{ width: `${p}%` }} />
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
          )}
       </div>
    </motion.div>
  );
}

const S10_PlaceDetail: React.FC<{ place: any, onBack: () => void, toggleSave: () => void, isSaved: boolean }> = ({ place, onBack, toggleSave, isSaved }) => {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <motion.div {...screenTransition} className="w-full h-[100dvh] bg-bg-base flex flex-col overflow-y-auto hide-scrollbar absolute z-30 inset-0">
       <div className="w-full h-[35vh] relative shrink-0">
          <div className="absolute inset-0 bg-surface flex items-center justify-center overflow-hidden">
             {place?.img ? (
                 <img src={place.img} className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full bg-cyber-purple/10 flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(45deg, #131313, #1A0D23)' }}>
                     <MapPin size={48} className="opacity-20 text-cyber-purple" />
                 </div>
             )}
          </div>
          <div className="absolute top-12 left-6 z-20">
              <button 
                  onClick={onBack} 
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white font-bold"
                  style={{ backdropFilter: 'blur(24px)', background: 'rgba(255,255,255,0.07)' }}
              >
                  ←
              </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent z-10" />
       </div>
       
       <div className="px-6 -mt-8 relative z-20 flex-1 pb-32">
          <div className="flex gap-2 mb-4">
             <span className="text-[12px] font-bold text-cyber-purple uppercase tracking-widest px-3 py-1 bg-cyber-purple/10 rounded-full">{place.matchScore}% Match</span>
             <span className="text-[12px] font-bold text-on-surface-dim px-3 py-1 bg-surface-high rounded-full">{place.priceRange}</span>
          </div>
          <h2 className="text-[32px] font-extrabold leading-[40px] mb-3">{place.name}</h2>
          <div className="flex items-start gap-2 mb-8">
             <MapPin size={16} className="text-on-surface-dim shrink-0 mt-1" />
             <p className="text-on-surface-dim text-[16px] leading-relaxed">{place.address}</p>
          </div>

          <div className="glass-panel bg-[rgba(255,255,255,0.03)] rounded-2xl p-6 mb-8 border border-outline">
             <h4 className="text-[12px] font-bold text-on-surface-dim mb-3 uppercase tracking-widest">Tại sao AI chọn chỗ này?</h4>
             <p className="text-[16px] leading-relaxed text-on-surface">"{place.whyMatch}"</p>
             <div className="mt-6 flex flex-col gap-3">
                 {Object.entries(place.dnaMatch || {}).map(([key, val]) => (
                     <div key={key} className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] text-on-surface-dim uppercase tracking-wider font-bold">{key}</span>
                            <span className="text-[10px] text-cyber-purple font-bold">{val as number}%</span>
                         </div>
                         <div className="w-full h-1 bg-surface-high rounded-full overflow-hidden">
                             <div className="h-full bg-cyber-purple neon-glow-purple" style={{ width: `${val}%` }} />
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          <div className="space-y-5">
             {["Độ ồn", "Ánh sáng", "Đám đông"].map((r, idx) => (
                <div key={r}>
                    <div className="flex justify-between text-[12px] mb-2 font-semibold">
                        <span>{r}</span>
                        <span className="text-on-surface-dim text-[10px] uppercase">Vừa phải</span>
                    </div>
                    <div className="w-full h-[3px] bg-surface-high rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 bg-white/30 rounded-full transition-all" style={{ width: `${[45, 78, 32][idx]}%` }} />
                    </div>
                </div>
             ))}
          </div>
       </div>

       <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 glass-panel border-t border-outline flex gap-4 z-40 bg-[rgba(19,19,19,0.85)]">
           <motion.button 
              onClick={toggleSave}
              whileTap={{ scale: 0.95 }}
              animate={isSaved ? { scale: [1, 1.1, 1], backgroundColor: "#00FFA3", color: "#131313", borderColor: "#00FFA3" } : { backgroundColor: "transparent", color: "#ffffff", borderColor: "#514255" }}
              className="flex-none w-[130px] h-[56px] rounded-full border border-outline font-bold text-[14px] bg-transparent flex items-center justify-center gap-2 transition-colors"
            >
              {isSaved ? (
                  <>Đã Lưu <Check size={16}/></>
              ) : "Lưu Tọa Độ"}
           </motion.button>
           <button onClick={() => setMapOpen(true)} className="flex-1 h-[56px] bg-acid-green text-acid-green-txt rounded-full font-bold text-[14px] neon-glow-acid flex items-center justify-center gap-2">
               BẬT MAP ĐI LUÔN
           </button>
       </div>

       {mapOpen && (
           <div className="fixed inset-0 z-50 bg-bg-base flex flex-col items-center justify-center p-6 text-center">
               <button onClick={() => setMapOpen(false)} className="absolute top-12 left-6 w-12 h-12 rounded-full bg-surface-high shadow-lg flex items-center justify-center z-10 border border-outline">←</button>
               <MapIcon size={48} className="text-acid-green mb-6 opacity-80" />
               <h3 className="text-[24px] font-bold mb-4">Đang mở Google Maps...</h3>
               <p className="text-on-surface-dim mb-8">Tính năng Map đã được ẩn trong chế độ preview này. Ở app thật, nó sẽ mở Maps chuyển hướng đến tọa độ này.</p>
               <button onClick={() => setMapOpen(false)} className="w-[180px] h-[48px] rounded-full border border-outline text-[14px] font-bold uppercase">Quay Lại</button>
           </div>
       )}
    </motion.div>
  );
}

const S11_Profile: React.FC<{ dnaResult: any, persona: any, personaDesc: any, onReQuiz: () => void, savedPlaces: any[], savedItineraries: any[] }> = ({ dnaResult, persona, personaDesc, onReQuiz, savedPlaces, savedItineraries }) => {
  const [soleMatch, setSoleMatch] = useState(false);
  
  const banners = React.useMemo(() => {
    return savedPlaces.slice(0, 3).map(p => p.img).filter(Boolean);
  }, [savedPlaces]);

  return (
    <motion.div {...screenTransition} className="w-full h-full overflow-y-auto hide-scrollbar bg-bg-base relative">
      {/* Header with optional banner */}
      <div className={`w-full relative ${banners.length > 0 ? 'h-[180px]' : 'h-[120px]'}`}>
         {banners.length > 0 && (
            <div className="absolute inset-0 flex">
               {banners.map((img, i) => (
                  <div key={i} className="flex-1 h-full"><img src={img} className="w-full h-full object-cover opacity-40" /></div>
               ))}
               <div className="absolute inset-0 bg-gradient-to-t from-bg-base to-transparent" />
            </div>
         )}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-[72px] h-[72px] rounded-full border-2 bg-surface flex items-center justify-center overflow-hidden" style={{ borderColor: persona.accentColor, boxShadow: `0 0 16px ${persona.accentColor}80` }}>
                <User size={32} className="text-on-surface-dim" />
            </div>
         </div>
      </div>

      <div className="px-6 pt-12 pb-24 flex flex-col items-center">
         <h2 className="text-[20px] font-bold mb-1">Dân Chơi Hệ Tần Số</h2>
         <p className="text-[14px] font-bold tracking-widest uppercase mb-4" style={{ color: persona.accentColor }}>{persona.name}</p>
         <button onClick={onReQuiz} className="px-6 py-2 rounded-full border border-outline text-[14px] font-semibold text-on-surface mb-8 hover:bg-surface transition-colors">
            Cập nhật tần số
         </button>

         {/* Spider Chart */}
         <div className="w-full max-w-[280px] aspect-square relative mb-8 flex items-center justify-center">
            <svg viewBox="-50 -50 100 100" className="w-[220px] h-[220px] overflow-visible">
               <polygon 
                  points={Object.keys(dnaResult.normalized).map((axis, i, arr) => {
                     const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
                     const radius = (dnaResult.normalized[axis] / 100) * 40;
                     return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
                  }).join(" ")}
                  fill={persona.accentColor} fillOpacity="0.2" stroke={persona.accentColor} strokeWidth="1"
               />
               {Object.keys(dnaResult.normalized).map((axis, i, arr) => {
                  const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
                  const radius = 45;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                     <text key={axis} x={x} y={y} fill="#888" fontSize="4" textAnchor="middle" alignmentBaseline="middle">
                        {axis}
                     </text>
                  )
               })}
            </svg>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 gap-3 w-full mb-8">
            {[
              { label: "Giờ khám phá", val: "128", unit: "giờ" },
              { label: "Tọa độ ngách", val: "14", unit: "chỗ" },
              { label: "Thành phố", val: "3", unit: "TP" },
              { label: "Đã Ping", val: "8", unit: "bạn" }
            ].map(s => (
               <div key={s.label} className="bg-surface rounded-2xl p-4 flex flex-col justify-between h-[100px] border border-outline relative overflow-hidden">
                  <div className="text-[12px] text-on-surface-dim font-medium">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-[28px] font-bold leading-none">{s.val}</span>
                     <span className="text-[12px] text-on-surface-dim font-semibold">{s.unit}</span>
                  </div>
               </div>
            ))}
         </div>

         {/* SOLE Match */}
         <div className="w-full glass-panel rounded-2xl p-5 mb-8 border border-outline relative overflow-hidden bg-surface">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="font-bold text-[16px]">SOLE Match</h3>
                  <p className="text-[12px] text-on-surface-dim">Bật để kết nối đồng âm quanh đây</p>
               </div>
               <div onClick={() => setSoleMatch(!soleMatch)} className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${soleMatch ? 'bg-acid-green' : 'bg-surface-high border border-outline'}`}>
                  <motion.div animate={{ left: soleMatch ? 26 : 2 }} className={`absolute top-1 w-4 h-4 rounded-full ${soleMatch ? 'bg-bg-base shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-on-surface-dim'}`} />
               </div>
            </div>
            {soleMatch && (
               <div className="flex flex-col gap-3">
                 {[
                   { name: "Urban Hermit", match: "98%", dist: "300m" },
                   { name: "Luxury Escapist", match: "85%", dist: "800m" },
                 ].map((u, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-high rounded-xl border border-outline">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyber-purple/20 flex items-center justify-center shrink-0">
                             <User size={18} className="text-cyber-purple" />
                          </div>
                          <div>
                             <h4 className="font-bold text-[14px] leading-tight text-white mb-0.5">{u.name}</h4>
                             <p className="text-[12px] text-cyber-purple font-bold">{u.match} Match <span className="text-on-surface-dim font-normal ml-1">• {u.dist}</span></p>
                          </div>
                       </div>
                       <button className="w-10 h-10 rounded-full bg-cyber-purple text-white flex items-center justify-center neon-glow-purple shrink-0">
                          <span className="text-[18px]">👋</span>
                       </button>
                    </div>
                 ))}
               </div>
            )}
         </div>

         {/* Collection */}
         <div className="w-full mb-8">
            <h3 className="font-bold text-[16px] mb-4">Collection của bạn</h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4">
               <div className="w-[140px] flex-none snap-start group cursor-pointer">
                  <div className="w-full aspect-square rounded-2xl bg-surface border border-outline overflow-hidden mb-2 relative">
                     {savedPlaces.length > 0 ? (
                        <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-[1px] bg-bg-base">
                           {[0,1,2,3].map(i => savedPlaces[i]?.img ? <img key={i} src={savedPlaces[i].img} className="w-full h-full object-cover" /> : <div key={i} className="bg-surface-high" />)}
                        </div>
                     ) : <div className="w-full h-full flex items-center justify-center text-on-surface-dim text-[12px]">Trống</div>}
                  </div>
                  <h4 className="font-bold text-[14px]">Tọa độ đã lưu</h4>
                  <p className="text-[12px] text-on-surface-dim">{savedPlaces.length} địa điểm</p>
               </div>
               <div className="w-[140px] flex-none snap-start aspect-square rounded-2xl border border-dashed border-outline flex flex-col justify-center items-center gap-2 cursor-pointer hover:bg-surface/50 transition-colors">
                  <Plus size={24} className="text-on-surface-dim" />
                  <span className="text-[12px] font-bold text-on-surface-dim">Tạo mới</span>
               </div>
            </div>
         </div>

         {/* Upcoming Itineraries */}
         <div className="w-full mb-8">
            <h3 className="font-bold text-[16px] mb-4">Kế hoạch sắp tới</h3>
            {savedItineraries.length === 0 ? (
               <div className="w-full py-8 text-center text-[12px] text-on-surface-dim bg-surface rounded-2xl border border-outline">Chưa có kế hoạch nào.</div>
            ) : (
               <div className="flex flex-col gap-3">
                  {savedItineraries.map((it, i) => (
                     <div key={i} className="w-full bg-surface rounded-2xl p-4 border border-outline flex justify-between items-center gap-4">
                        <div>
                           <h4 className="font-bold text-[14px] leading-tight mb-1">{it.destination || "Chuyến đi 1 ngày"}</h4>
                           <p className="text-[12px] text-on-surface-dim">Cuối tuần này • {it.totalDays ? `${it.totalDays} ngày` : `${it.places?.length || 0} địa điểm`}</p>
                        </div>
                        <button className="px-4 py-2 bg-acid-green text-acid-green-txt rounded-full text-[12px] font-bold">Bắt đầu</button>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Gamification Badges */}
         <div className="w-full">
            <h3 className="font-bold text-[16px] mb-4">Danh hiệu</h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
               {["Cú Đêm Chính Hiệu", "Bậc Thầy Local"].map(b => (
                  <div key={b} className="flex flex-col items-center gap-2 flex-none w-[80px]">
                     <div className="w-16 h-16 bg-cyber-purple/20 border border-cyber-purple rounded-xl rotate-45 flex items-center justify-center shadow-[0_0_12px_rgba(189,0,255,0.3)]">
                        <div className="-rotate-45 font-bold text-[24px]">🏆</div>
                     </div>
                     <p className="text-[10px] text-center font-bold mt-2 leading-tight">{b}</p>
                  </div>
               ))}
               <div className="flex flex-col items-center gap-2 flex-none w-[80px] opacity-40">
                     <div className="w-16 h-16 bg-surface-high border border-outline rounded-xl rotate-45 flex items-center justify-center">
                        <div className="-rotate-45 font-bold text-[16px] text-on-surface-dim">🔒</div>
                     </div>
                     <p className="text-[10px] text-center font-bold mt-2 leading-tight text-on-surface-dim">Chưa mở</p>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
