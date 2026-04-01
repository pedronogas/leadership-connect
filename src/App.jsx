import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  ComposedChart, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, Users, Database, ChevronUp, ChevronDown, Minus, Calendar, MapPin, Monitor, Save, CheckCircle, Clock, ExternalLink, Image as ImageIcon, Plus, X, List, Trash2, Pencil, Search, Star, TrendingDown, Lightbulb, Settings, Send, FileText, Upload, Sparkles, BrainCircuit, Download, MousePointer2, Loader2, Bug, Terminal, AlertCircle, Menu
} from 'lucide-react';

// --- Celfocus Branding Guidelines V2.0 ---
const BRAND = {
  colors: {
    bg: '#F8F8F8',       
    cardBg: '#FFFFFF',
    text: '#000000',     
    textLight: '#636466',
    primary: '#ED1C24',  
    secondary: '#000000',
    purple: '#494E5E',   
    positive: '#719F81', 
    negative: '#ED1C24', 
    neutral: '#9C9B9C',  
    border: '#EEEEEE'    
  },
  font: '"Museo Sans", Aptos, system-ui, sans-serif'
};

// --- Helper Functions ---
const monthOrder = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
  'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

const normalize = (val) => String(val || '').trim();

const monthMapping = {
  'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April', 'may': 'May', 'jun': 'June',
  'jul': 'July', 'aug': 'August', 'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
};

const robustNormalizeMonth = (m) => {
  const low = normalize(m).toLowerCase().substring(0, 3);
  return monthMapping[low] || normalize(m);
};

const safeParseFloat = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const str = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
};

const safeParseInt = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const str = String(val).replace(/[^0-9]/g, '');
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? null : parsed;
};

// --- Shared Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-sm border border-[#EEEEEE] ${className}`} style={{ borderRadius: '4px' }}>
    {children}
  </div>
);

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const Avatar = ({ name, className = "" }) => {
  const initials = name ? name.trim().split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";
  return (
    <div className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-[#EEEEEE] text-[#000000] font-black text-xs border border-[#C7C8CA] ${className}`}>
      {initials}
    </div>
  );
};

const DeltaIndicator = ({ current, previous }) => {
  if (current === null || previous === null || current === undefined || previous === undefined) return null;
  const delta = (current - previous).toFixed(2);
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  return (
    <div className={`flex items-center text-sm font-bold ${isPositive ? 'text-[#719F81]' : isNegative ? 'text-[#ED1C24]' : 'text-[#9C9B9C]'}`}>
      {isPositive ? <ChevronUp size={16} /> : (isNegative ? <ChevronDown size={16} /> : <Minus size={16} />)}
      <span>{Math.abs(delta)}</span>
      <span className="text-[#9C9B9C] ml-1 font-normal text-xs">vs prev</span>
    </div>
  );
};

const callGemini = async (prompt, systemInstruction = "You are a professional business analyst for Celfocus.") => {
  const apiKey = "AIzaSyBuZiTsUV4PLuwq1DTpWvRRsuHw7KlQyBY";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (e) {
    return "AI generation currently unavailable.";
  }
};

const CleanAISummary = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="text-sm font-medium leading-relaxed pr-8 text-black">
      {lines.map((line, i) => {
        let cleanLine = line.trim().replace(/\*\*/g, '').replace(/^#+\s*/, '');
        if (!cleanLine) return null;
        const lowerLine = cleanLine.toLowerCase();
        const isHeader = lowerLine.includes('summary') || lowerLine.includes('strengths') || lowerLine.includes('risks') || lowerLine.includes('actions') || lowerLine.includes('metrics') || lowerLine.includes('performing') || lowerLine.includes('trend') || lowerLine.includes('recommendations');
        if (isHeader && cleanLine.length < 35) {
          return <div key={`header-${i}`} className={`font-black text-[15px] uppercase tracking-wider text-[#000000] ${i !== 0 ? 'mt-5' : ''} mb-2`}>{cleanLine.replace(/:$/, '')}</div>;
        }
        cleanLine = cleanLine.replace(/^[-*]\s*/, ''); 
        return <div key={`line-${i}`} className="flex items-start gap-2 mb-2 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-[#ED1C24] mt-1.5 shrink-0"></div><span className="flex-1 text-[#333333]">{cleanLine}</span></div>;
      })}
    </div>
  );
};

// --- Sub-page Components ---

function InsightsPage({ completedEvents, brand }) {
  const [aiRecs, setAiRecs] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const metrics = useMemo(() => {
    if (completedEvents.length === 0) return null;
    let sumAtt = 0, sumNps = 0;
    let maxAtt = -1, bestAttEvent = null, maxNps = -1, bestNpsEvent = null;
    let minAtt = Infinity, worstAttEvent = null, minNps = Infinity, worstNpsEvent = null;
    completedEvents.forEach(e => {
      sumAtt += (e.attendance || 0);
      sumNps += (e.nps || 0);
      if (e.attendance !== null && e.attendance > maxAtt) { maxAtt = e.attendance; bestAttEvent = e; }
      if (e.attendance !== null && e.attendance < minAtt) { minAtt = e.attendance; worstAttEvent = e; }
      if (e.nps !== null && e.nps > maxNps) { maxNps = e.nps; bestNpsEvent = e; }
      if (e.nps !== null && e.nps < minNps) { minNps = e.nps; worstNpsEvent = e; }
    });
    return { avgAttendance: Math.round(sumAtt / completedEvents.length), avgNps: Math.round(sumNps / completedEvents.length), bestAttEvent, worstAttEvent, bestNpsEvent, worstNpsEvent };
  }, [completedEvents]);

  const trendData = completedEvents.map(e => ({ name: `${e.month.substring(0,3)} ${e.year}`, Attendance: e.attendance, NPS: e.nps, Insightful: e.insightful, Logistics: e.logistics }));

  const handleAnalyze = async () => {
    if (!metrics) return;
    setIsAnalyzing(true);
    const prompt = `Analyze the performance dashboard and produce a clean, structured executive summary based only on the information provided. The summary should be objective, concise, and easy to read.

Use this exact structure:
Overall Summary
2 to 3 sentences describing the general performance pattern across attendance, NPS, insightful score, and logistics.
Core Metrics
Attendance: mention average attendance and whether it is strong or weak.
NPS: mention average NPS and whether it suggests positive or negative sentiment.
Insightful score: describe the overall trend.
Logistics score: describe the overall trend.
Include any notable high or low points shown in the dashboard.
Best Performing Events
Mention the highest engagement event.
Mention the highest rated event.
Explain briefly why these stand out based on the chart data.
Weakest Performing Events
Mention the lowest engagement event.
Mention the lowest rated event.
Note any clear patterns behind weak performance.
Trend Observations
Summarize the main trends visible in the historical charts.
Highlight any months or periods with peaks, drops, or divergence between metrics.
Mention whether attendance and NPS move together or not.
Mention whether insightful and logistics scores appear aligned or diverging.
Recommendations
Provide 3 to 5 specific actions.
Focus on improving low-performing events, maintaining high-performing formats, and reducing drops in engagement or logistics.

Formatting rules:
Use short paragraphs and bullets.
Keep language factual and direct.
Do not use markdown symbols like ###, **, or inline labels inside the text.
Do not repeat the same insight in multiple sections.
Do not add assumptions beyond the data provided.

Data to analyze:
- Average Attendance: ${metrics.avgAttendance}%
- Average NPS: ${metrics.avgNps}
- Best Attendance: ${metrics.bestAttEvent?.theme} (${metrics.bestAttEvent?.attendance}%)
- Best NPS: ${metrics.bestNpsEvent?.theme} (${metrics.bestNpsEvent?.nps})
- Lowest Attendance: ${metrics.worstAttEvent?.theme} (${metrics.worstAttEvent?.attendance}%)
- Lowest NPS: ${metrics.worstNpsEvent?.theme} (${metrics.worstNpsEvent?.nps})
- Historical Trend Data: ${JSON.stringify(trendData)}`;

    const res = await callGemini(prompt);
    setAiRecs(res);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Performance Insights</h1>
        <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-[#ED1C24] hover:bg-[#811116] text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2 transition-all">
          <BrainCircuit size={16} />{isAnalyzing ? "..." : "✨ AI Recommendations"}
        </button>
      </div>
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-5 border-t-4 border-t-black flex flex-col justify-center">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Avg Attendance</div>
            <div className="text-4xl font-black">{metrics.avgAttendance}%</div>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#719F81]">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-3">Highest Engagement</div>
            <div className="text-sm font-black truncate">{metrics.bestAttEvent?.theme || 'N/A'}</div>
            <div className="text-[10px] font-bold text-[#636466] uppercase mt-1 truncate">{metrics.bestAttEvent?.host} • {metrics.bestAttEvent?.month} {metrics.bestAttEvent?.year}</div>
            <div className="text-xl font-black text-[#719F81] mt-2">{metrics.bestAttEvent?.attendance}%</div>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#ED1C24]">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-3">Lowest Engagement</div>
            <div className="text-sm font-black truncate">{metrics.worstAttEvent?.theme || 'N/A'}</div>
            <div className="text-[10px] font-bold text-[#636466] uppercase mt-1 truncate">{metrics.worstAttEvent?.host} • {metrics.worstAttEvent?.month} {metrics.worstAttEvent?.year}</div>
            <div className="text-xl font-black text-[#ED1C24] mt-2">{metrics.worstAttEvent?.attendance}%</div>
          </Card>

          <Card className="p-5 border-t-4 border-t-black flex flex-col justify-center">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Avg NPS</div>
            <div className="text-4xl font-black">{metrics.avgNps}</div>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#719F81]">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-3">Highest Rated</div>
            <div className="text-sm font-black truncate">{metrics.bestNpsEvent?.theme || 'N/A'}</div>
            <div className="text-[10px] font-bold text-[#636466] uppercase mt-1 truncate">{metrics.bestNpsEvent?.host} • {metrics.bestNpsEvent?.month} {metrics.bestNpsEvent?.year}</div>
            <div className="text-xl font-black text-[#719F81] mt-2">{metrics.bestNpsEvent?.nps} pts</div>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#ED1C24]">
            <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-3">Lowest Rated</div>
            <div className="text-sm font-black truncate">{metrics.worstNpsEvent?.theme || 'N/A'}</div>
            <div className="text-[10px] font-bold text-[#636466] uppercase mt-1 truncate">{metrics.worstNpsEvent?.host} • {metrics.worstNpsEvent?.month} {metrics.worstNpsEvent?.year}</div>
            <div className="text-xl font-black text-[#ED1C24] mt-2">{metrics.worstNpsEvent?.nps} pts</div>
          </Card>
        </div>
      )}
      {aiRecs && <Card className="p-6 border-l-4 border-l-[#719F81] relative animate-in slide-in-from-top"><button onClick={() => setAiRecs('')} className="absolute top-4 right-4 text-[#9C9B9C]"><X size={20}/></button><CleanAISummary text={aiRecs} /></Card>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        <Card className="p-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={brand.colors.border}/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: brand.colors.textLight, fontSize: 10, fontWeight: 'bold'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: brand.colors.textLight, fontSize: 10, fontWeight: 'bold'}} />
              <RechartsTooltip/>
              <Legend/>
              <Bar dataKey="Attendance" fill={brand.colors.secondary} maxBarSize={40} />
              <Line dataKey="NPS" stroke={brand.colors.primary} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={brand.colors.border}/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: brand.colors.textLight, fontSize: 10, fontWeight: 'bold'}} dy={10} />
              <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: brand.colors.textLight, fontSize: 10, fontWeight: 'bold'}} />
              <RechartsTooltip/>
              <Legend/>
              <Line type="monotone" dataKey="Insightful" stroke={brand.colors.purple} strokeWidth={3} />
              <Line type="monotone" dataKey="Logistics" stroke={brand.colors.neutral} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function ParticipantTrackerPage({ partData, aggData }) {
  const participantsList = useMemo(() => {
    if (!partData) return [];
    return [...new Set(partData.map(p => String(p.participantName || "")))].filter(Boolean).sort();
  }, [partData]);

  const [selectedPerson, setSelectedPerson] = useState(participantsList[0] || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  const macroStats = useMemo(() => {
    const counts = {};
    let totalAtt = 0;
    
    participantsList.forEach(name => counts[name] = 0);

    if (partData) {
      partData.forEach(p => {
        if (p.attendanceType === 'In-person' || p.attendanceType === 'Remote') {
          const name = String(p.participantName || "");
          if (counts[name] !== undefined) {
            counts[name]++;
            totalAtt++;
          }
        }
      });
    }

    if (participantsList.length === 0) return { mostActive: { names: '-', count: 0 }, leastActive: { names: '-', count: 0 }, average: 0 };

    let maxCount = -1;
    let minCount = Infinity;
    let maxNames = [];
    let minNames = [];

    Object.entries(counts).forEach(([name, c]) => {
      if (c > maxCount) { maxCount = c; maxNames = [name]; }
      else if (c === maxCount) { maxNames.push(name); }

      if (c < minCount) { minCount = c; minNames = [name]; }
      else if (c === minCount) { minNames.push(name); }
    });

    const formatNames = (names) => names.length > 2 ? `${names[0]}, ${names[1]} +${names.length-2}` : names.join(', ');

    return {
      mostActive: { names: formatNames(maxNames) || '-', count: maxCount === -1 ? 0 : maxCount },
      leastActive: { names: formatNames(minNames) || '-', count: minCount === Infinity ? 0 : minCount },
      average: (totalAtt / participantsList.length).toFixed(1)
    };
  }, [partData, participantsList]);

  const history = useMemo(() => {
    if (!selectedPerson || !partData) return [];
    return partData.filter(p => String(p.participantName || "") === selectedPerson && p.attendanceType).map(p => {
      const e = aggData.find(ev => normalize(ev.year) === normalize(p.year) && robustNormalizeMonth(ev.month).toLowerCase() === robustNormalizeMonth(p.month).toLowerCase());
      return { ...p, eventDate: `${p.month} ${p.year}`, theme: e?.theme || '-', host: e?.host || '-', id: e?.id || 0 };
    }).sort((a,b) => b.id - a.id);
  }, [selectedPerson, partData, aggData]);

  const stats = useMemo(() => {
    const total = history.length;
    const inP = history.filter(p => p.attendanceType === 'In-person').length;
    const rem = history.filter(p => p.attendanceType === 'Remote').length;
    return { total, inP, rem, pref: total === 0 ? 'N/A' : (inP >= rem ? 'In-person' : 'Remote') };
  }, [history]);

  const handleConsult = async () => {
    setIsConsulting(true);
    const prompt = `Provide engagement advice for the participant "${selectedPerson}".
Event History: ${JSON.stringify(history)}

Use this exact structure:
Summary
1-2 sentences summarizing their general attendance pattern.
Trend Observations
Note if they prefer In-person or Remote, and if their attendance is consistent, improving, or dropping based on the dates.
Recommendations
1-2 actionable tips to maintain or improve their engagement for future events.

Formatting rules:
Keep it brief, factual, and direct. 
Do not use markdown symbols like ### or **.
Do not add assumptions beyond the provided history.`;

    const res = await callGemini(prompt);
    setAiAdvice(res);
    setIsConsulting(false);
  };

  return (
    <div className="space-y-6 text-sm text-black">
      <div className="flex justify-between items-end mb-4">
        <div><h1 className="text-2xl font-black">Engagement Tracker</h1><p className="text-[#636466] font-medium">Analyze global and individual presence over time.</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-t-4 border-t-[#719F81]">
          <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Most Participations</div>
          <div className="text-xl font-black truncate" title={macroStats.mostActive.names}>{macroStats.mostActive.names}</div>
          <div className="text-[10px] font-bold text-[#636466] uppercase mt-1">{macroStats.mostActive.count} Sessions</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-[#ED1C24]">
          <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Least Participations</div>
          <div className="text-xl font-black truncate" title={macroStats.leastActive.names}>{macroStats.leastActive.names}</div>
          <div className="text-[10px] font-bold text-[#636466] uppercase mt-1">{macroStats.leastActive.count} Sessions</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-black flex flex-col justify-center">
          <div className="text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Avg Events Attended</div>
          <div className="text-4xl font-black">{macroStats.average}</div>
        </Card>
      </div>

      <div className="border-t border-[#EEEEEE] my-6"></div>

      <div className="flex justify-between items-end mb-8">
        <div><h2 className="text-lg font-black">Individual Analysis</h2></div>
        <div className="flex gap-2 items-end">
          <div className="w-72 relative">
            <label className="block text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Select Participant</label>
            <div className="w-full border border-[#C7C8CA] rounded p-2.5 text-sm font-black bg-white flex justify-between items-center cursor-pointer hover:border-[#ED1C24] transition-all" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="truncate">{selectedPerson || "Choose..."}</span><ChevronDown size={16} className="text-[#ED1C24]" />
            </div>
            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-[#C7C8CA] rounded shadow-lg overflow-hidden animate-in fade-in duration-200">
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="p-2.5 border-b flex items-center gap-2 bg-[#F8F8F8]"><Search size={16} className="text-[#9C9B9C]" /><input type="text" autoFocus className="w-full text-xs font-bold outline-none bg-transparent" placeholder="Filter..." value={trackerSearch} onChange={e => setTrackerSearch(e.target.value)}/></div>
                <ul className="max-h-60 overflow-y-auto">
                  {participantsList.filter(p => p.toLowerCase().includes(trackerSearch.toLowerCase())).map(p => (
                    <li key={`part-opt-${p}`} className={`px-3 py-2.5 text-xs font-bold cursor-pointer hover:bg-[#F8F8F8] transition-colors ${selectedPerson === p ? 'text-[#ED1C24] bg-[#FF4F50]/5 border-l-4 border-[#ED1C24]' : 'text-black'}`} onClick={() => { setSelectedPerson(p); setIsDropdownOpen(false); setTrackerSearch(''); }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={handleConsult} disabled={isConsulting} className="bg-black hover:bg-[#333333] text-white px-4 h-[42px] rounded flex items-center gap-2 text-xs font-black transition-all disabled:opacity-50 uppercase tracking-widest active:scale-[0.98]"><Send size={16} />Advice</button>
        </div>
      </div>
      {aiAdvice && (
        <Card className="p-5 border-l-4 border-l-[#ED1C24] relative animate-in slide-in-from-right duration-300">
          <button onClick={() => setAiAdvice('')} className="absolute top-4 right-4 text-[#9C9B9C] hover:text-black transition-colors"><X size={20}/></button>
          <CleanAISummary text={aiAdvice} />
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-[#EEEEEE] flex items-center justify-center text-xl font-black">{stats.total}</div><div><div className="text-[10px] font-black text-[#636466] uppercase">Events Attended</div><div className="text-sm font-black text-[#ED1C24]">{stats.total} Sessions</div></div></Card>
        <Card className="p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-[#FF4F50]/10 flex items-center justify-center text-[#ED1C24]">{stats.pref === 'In-person' ? <MapPin size={24}/> : <Monitor size={24}/>}</div><div><div className="text-[10px] font-black text-[#636466] uppercase">Preference</div><div className="text-sm font-black">{stats.pref}</div></div></Card>
        <Card className="p-6"><div className="text-[10px] font-black text-[#636466] uppercase mb-3">Presence Ratio</div><div className="w-full bg-[#EEEEEE] rounded-full h-2.5 mb-2 overflow-hidden flex"><div className="bg-black h-2.5" style={{ width: `${stats.total ? (stats.inP/stats.total)*100 : 0}%` }}></div><div className="bg-[#ED1C24] h-2.5" style={{ width: `${stats.total ? (stats.rem/stats.total)*100 : 0}%` }}></div></div><div className="flex justify-between text-[10px] font-black uppercase text-[#9C9B9C]"><span>{stats.inP} In-person</span><span>{stats.rem} Remote</span></div></Card>
      </div>
      <Card className="mt-6 overflow-hidden"><div className="p-5 border-b text-black font-black uppercase tracking-widest text-xs">Event History</div><table className="w-full text-left text-xs font-bold"><thead className="bg-[#F8F8F8] border-b"><tr><th className="py-3 px-5 text-[#9C9B9C] uppercase tracking-widest">Date</th><th className="py-3 px-5 text-[#9C9B9C] uppercase tracking-widest">Theme</th><th className="py-3 px-5 text-[#9C9B9C] uppercase tracking-widest">Host</th><th className="py-3 px-5 text-[#9C9B9C] uppercase tracking-widest">Mode</th></tr></thead><tbody className="divide-y">{history.map((row, i) => (<tr key={`history-${i}`} className="hover:bg-[#F8F8F8] transition-colors"><td className="py-3 px-5">{row.eventDate}</td><td className="py-3 px-5">{row.theme}</td><td className="py-3 px-5">{row.host}</td><td className="py-3 px-5"><span className={`px-2 py-1 rounded-sm text-[10px] font-black uppercase border ${row.attendanceType === 'In-person' ? 'border-black text-black' : 'border-[#ED1C24] text-[#ED1C24]'}`}>{row.attendanceType}</span></td></tr>))}</tbody></table></Card>
    </div>
  );
}

function DataManagementPage({ aggData, partData, fetchAllData, isConnecting, connectionError, webhookUrl, setWebhookUrl }) {
  const [localData, setLocalData] = useState([...aggData]);
  const [localPartData, setLocalPartData] = useState([...partData]);
  const [activeTable, setActiveTable] = useState('events');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalData([...aggData]);
    setLocalPartData([...partData]);
  }, [aggData, partData]);

  const handleSync = async () => {
    setIsSaving(true);
    try {
      const eventsToSync = localData.map(e => ({ year: e.year, month: e.month, attendance: e.attendance, inPerson: e.inPerson, remote: e.remote, nps: e.nps, insightful: e.insightful, logistics: e.logistics, host: e.host, theme: e.theme, gallery: e.gallery ? JSON.stringify(e.gallery.map(g => g.url || g)) : "[]" }));
      const agendasToSync = localData.map(e => ({ year: e.year, month: e.month, slots: [e.agenda?.[0] || {topic:"",speaker:"",artifact:""}, e.agenda?.[1] || {topic:"",speaker:"",artifact:""}, e.agenda?.[2] || {topic:"",speaker:"",artifact:""}] }));
      await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ action: 'syncData', events: eventsToSync, participants: localPartData, agendas: agendasToSync }) });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchAllData();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const eventHeaders = ['Year','Month','Att%','In-P','Rem','NPS','Insight','Log','Host','Theme'];
  const partHeaders = ['Year','Month','NB ID','Full Name','Status'];

  return (
    <div className="space-y-6 h-full flex flex-col font-bold text-black">
      <div className="flex justify-between items-end"><div><h1 className="text-2xl font-black">Data Synchronization</h1><p className="text-[#636466] font-medium">Manage master spreadsheets.</p></div><div className="flex gap-3 items-center">{saveSuccess && <span className="text-[#719F81] text-xs font-black uppercase flex items-center gap-1"><CheckCircle size={16}/> Synced</span>}<button onClick={handleSync} disabled={isSaving} className="bg-[#ED1C24] text-white px-5 py-2.5 rounded shadow-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[#811116] disabled:opacity-50"><Save size={16} />{isSaving ? 'Saving...' : 'Push Updates'}</button></div></div>
      <Card className="p-4 border-l-4 border-l-[#719F81] flex flex-col md:flex-row gap-4 items-end"><div className="flex-1"><label className="block text-[10px] font-black text-[#9C9B9C] uppercase mb-1">API Webhook URL</label><input type="text" value={webhookUrl || ''} onChange={e => setWebhookUrl(e.target.value)} className="w-full border border-[#C7C8CA] rounded p-2 text-xs outline-none focus:ring-1 focus:ring-[#ED1C24] transition-all" /></div><button onClick={fetchAllData} disabled={isConnecting} className="bg-[#EEEEEE] text-black px-6 py-2.5 rounded text-xs font-black uppercase transition-all hover:bg-[#C7C8CA]">{isConnecting ? '...' : 'Fetch All Data'}</button></Card>
      {connectionError && <div className="bg-[#ED1C24] text-white p-3 rounded text-xs font-black uppercase">{connectionError}</div>}
      <div className="flex gap-2"><button onClick={() => setActiveTable('events')} className={`px-5 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeTable === 'events' ? 'bg-black text-white' : 'bg-[#EEEEEE] text-[#636466]'}`}>Events</button><button onClick={() => setActiveTable('participants')} className={`px-5 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeTable === 'participants' ? 'bg-black text-white' : 'bg-[#EEEEEE] text-[#636466]'}`}>Participants</button></div>
      <Card className="flex-1 overflow-hidden flex flex-col border border-[#EEEEEE]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px] text-[10px]">
            <thead className="bg-[#F8F8F8] border-b sticky top-0 font-black text-[#9C9B9C] uppercase tracking-wider">
              <tr>{(activeTable === 'events' ? eventHeaders : partHeaders).map((h, i) => <th key={`head-${h}-${i}`} className="py-2 px-3 border-r">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y font-bold text-black">
              {activeTable === 'events' ? localData.map((r, i) => (
                <tr key={`ev-row-${r.id || i}`} className="hover:bg-[#F8F8F8]">
                  <td className="p-1 border-r"><input value={r.year || ''} onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, year: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.month || ''} onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, month: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.attendance || ''} type="number" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, attendance: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.inPerson || ''} type="number" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, inPerson: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.remote || ''} type="number" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, remote: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.nps || ''} type="number" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, nps: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.insightful || ''} type="number" step="0.1" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, insightful: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.logistics || ''} type="number" step="0.1" onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, logistics: Number(e.target.value)} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={r.host || ''} onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, host: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1"><input value={r.theme || ''} onChange={e => setLocalData(d => d.map(x => x.id === r.id ? {...x, theme: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                </tr>
              )) : localPartData.map((p, i) => (
                <tr key={`part-row-${p.id || i}`} className="hover:bg-[#F8F8F8] text-black">
                  <td className="p-1 border-r"><input value={p.year || ''} onChange={e => setLocalPartData(d => d.map(x => x.id === p.id ? {...x, year: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={p.month || ''} onChange={e => setLocalPartData(d => d.map(x => x.id === p.id ? {...x, month: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={p.nb || ''} onChange={e => setLocalPartData(d => d.map(x => x.id === p.id ? {...x, nb: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><input value={p.participantName || ''} onChange={e => setLocalPartData(d => d.map(x => x.id === p.id ? {...x, participantName: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"/></td>
                  <td className="p-1 border-r"><select value={p.attendanceType || ''} onChange={e => setLocalPartData(d => d.map(x => x.id === p.id ? {...x, attendanceType: e.target.value} : x))} className="w-full bg-transparent border-none outline-none font-bold"><option value="">Absence</option><option value="In-person">In-person (X)</option><option value="Remote">Remote (R)</option></select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function EventManagementPage({ aggData, setAggData }) {
  const [selectedEventId, setSelectedEventId] = useState(aggData[aggData.length - 1]?.id || '');
  const selectedEvent = aggData.find(e => e.id === Number(selectedEventId)) || aggData[0] || {};
  const [newTopic, setNewTopic] = useState('');
  const [newSpeaker, setNewSpeaker] = useState('');

  const handleAdd = () => { 
    if (newTopic && newSpeaker) {
      setAggData(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, agenda: [...(e.agenda || []), { topic: newTopic, speaker: newSpeaker }] } : e)); 
      setNewTopic(''); setNewSpeaker(''); 
    }
  };

  return (
    <div className="space-y-6 text-sm font-bold animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8 text-black">
        <div><h1 className="text-2xl font-black">Strategic Content</h1><p className="text-[#636466] font-medium">Design event themes and content flows.</p></div>
        <div className="w-80">
          <label className="block text-[10px] font-black text-[#9C9B9C] uppercase mb-1">Select Event</label>
          <select className="w-full border border-[#C7C8CA] rounded p-2.5 text-xs font-black outline-none bg-white text-[#ED1C24]" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
            {aggData.map(e => <option key={`opt-${e.id}`} value={e.id}>{e.month} {e.year} - {e.theme || 'Untitled'}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#ED1C24]" /> Identity</h3>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black text-[#636466] uppercase mb-1">Strategic Theme</label><input type="text" readOnly value={selectedEvent.theme || ''} className="w-full border rounded p-2.5 text-xs font-medium outline-none bg-[#F8F8F8]"/></div>
              <div><label className="block text-[10px] font-black text-[#636466] uppercase mb-1">Master Host</label><input type="text" readOnly value={selectedEvent.host || ''} className="w-full border rounded p-2.5 text-xs font-medium outline-none bg-[#F8F8F8]"/></div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 text-black">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-black"><List size={20} className="text-[#ED1C24]" /> Live Agenda</h3>
            <div className="space-y-3 mb-6">
              {(selectedEvent.agenda || []).map((item, idx) => (
                <div key={`agenda-${idx}`} className="flex items-center justify-between p-3 border rounded bg-[#F8F8F8] group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.speaker}/>
                    <div className="text-xs font-bold">{item.topic}<div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{item.speaker}</div></div>
                  </div>
                  <button onClick={() => setAggData(prev => prev.map(x => x.id === selectedEvent.id ? {...x, agenda: x.agenda.filter((_,i)=>i!==idx)} : x))} className="p-1.5 opacity-0 group-hover:opacity-100 text-[#ED1C24] hover:bg-red-50 rounded transition-all"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="bg-[#F8F8F8] p-4 rounded border">
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs"><input placeholder="New Topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)} className="border rounded p-2 outline-none"/><input placeholder="Speaker..." value={newSpeaker} onChange={e => setNewSpeaker(e.target.value)} className="border rounded p-2 outline-none"/></div>
              <button onClick={handleAdd} disabled={!newTopic || !newSpeaker} className="bg-[#ED1C24] text-white px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest w-full transition-all">Add Topic</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DebugConsolePage({ logs, clearLogs }) {
  return (
    <div className="space-y-6 text-black">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black">Debug Console</h1><p className="text-[#636466] font-medium text-sm">Real-time application logs.</p></div>
        <button onClick={clearLogs} className="text-xs font-black uppercase text-[#ED1C24] hover:underline">Clear Logs</button>
      </div>
      <Card className="bg-black text-[#00FF41] p-4 font-mono text-[11px] h-[500px] overflow-y-auto">
        {logs.length === 0 ? <div className="text-neutral-600 opacity-50 flex items-center gap-2"><Terminal size={14}/> Listening for events...</div> : logs.map((log, i) => (
          <div key={`log-${i}`} className="mb-1 border-b border-white/5 pb-1 last:border-0">
            <span className="text-neutral-500 mr-2">[{log.time}]</span>
            <span className={`${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>{log.type.toUpperCase()}:</span> {log.msg}
            {log.details && <div className="ml-14 text-neutral-400 italic">{log.details}</div>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// --- Main Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [aggData, setAggData] = useState([]);
  const [partData, setPartData] = useState([]); 
  const [expandedImage, setExpandedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState('All');

  const [webhookUrl, setWebhookUrl] = useState("https://script.google.com/macros/s/AKfycbyurUBx5RLld5by5_DnUCruu1hnQDsxH3Hj1sB_O3LG6EgyCS96-pRF_Pxtl1wKjst4iQ/exec");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const addLog = (type, msg, details = null) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, msg, details }, ...prev].slice(0, 100));
  };

  const fetchAllData = async () => {
    setIsConnecting(true); setConnectionError(null);
    addLog('info', 'Starting main data fetch...');
    try {
      const response = await fetch(webhookUrl);
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message || "Sync error.");
      
      const events = result.events.map((r, i) => {
        let attVal = safeParseFloat(r.attendance);
        if (attVal !== null && attVal <= 1 && attVal > 0) attVal = Math.round(attVal * 100);
        
        let parsedGallery = [];
        try {
          const raw = JSON.parse(r.gallery || "[]");
          parsedGallery = Array.isArray(raw) ? raw : [raw];
        } catch(e) {
          parsedGallery = r.gallery ? [r.gallery] : [];
        }
        parsedGallery = parsedGallery.map(g => typeof g === 'object' ? g.url : g).filter(Boolean);

        return { 
          id: i + 100, year: String(r.year || ''), month: String(r.month || ''), 
          attendance: attVal, inPerson: safeParseInt(r.inPerson), 
          remote: safeParseInt(r.remote), nps: safeParseInt(r.nps), 
          insightful: safeParseFloat(r.insightful), logistics: safeParseFloat(r.logistics), 
          host: String(r.host || ''), theme: String(r.theme || ''),
          agenda: (result.agendas || []).find(a => normalize(a.year) === normalize(r.year) && robustNormalizeMonth(a.month) === robustNormalizeMonth(r.month))?.slots || [],
          gallery: parsedGallery
        };
      });

      const participants = (result.participants || []).map((p, i) => ({ 
        id: i + 1000, year: String(p.year || ''), month: String(p.month || ''), nb: String(p.nb || ''), 
        participantName: String(p.name || ''), attendanceType: p.presence === 'X' ? 'In-person' : (p.presence === 'R' ? 'Remote' : '') 
      }));

      setAggData(events); setPartData(participants);
      addLog('success', `Fetched ${events.length} events and ${participants.length} roster entries.`);
    } catch (err) { 
      setConnectionError(err.message); addLog('error', 'Main fetch failed', err.toString());
    } finally { setIsConnecting(false); setIsLoadingInitial(false); }
  };

  useEffect(() => { fetchAllData(); }, []);

  const completedEvents = useMemo(() => {
    return [...aggData].filter(e => e.attendance !== null).sort((a, b) => {
      if (normalize(a.year) !== normalize(b.year)) return safeParseInt(a.year) - safeParseInt(b.year);
      return (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0);
    });
  }, [aggData]);

  const latestEventIdWithData = useMemo(() => {
    if (completedEvents.length === 0) return '';
    // Reverse search to find the most recent event that actually has participants mapped to it
    for (let i = completedEvents.length - 1; i >= 0; i--) {
      const ev = completedEvents[i];
      const targetY = normalize(ev.year);
      const targetM = robustNormalizeMonth(ev.month).toLowerCase();
      const hasParticipants = partData.some(p => 
        normalize(p.year) === targetY && 
        robustNormalizeMonth(p.month).toLowerCase() === targetM
      );
      if (hasParticipants) return ev.id;
    }
    // Fallback to the absolute latest completed event if none have roster data
    return completedEvents[completedEvents.length - 1].id;
  }, [completedEvents, partData]);

  const [selectedHomeEventId, setSelectedHomeEventId] = useState('');
  const currentHomeEvent = useMemo(() => {
    const idToFind = selectedHomeEventId === '' ? latestEventIdWithData : Number(selectedHomeEventId);
    return completedEvents.find(e => e.id === idToFind) || completedEvents[completedEvents.length - 1];
  }, [completedEvents, selectedHomeEventId, latestEventIdWithData]);

  const prevHomeEvent = useMemo(() => {
    if (!currentHomeEvent) return null;
    const idx = completedEvents.findIndex(e => e.id === currentHomeEvent.id);
    return idx > 0 ? completedEvents[idx - 1] : null;
  }, [completedEvents, currentHomeEvent]);

  const filteredPhotos = useMemo(() => {
    return (currentHomeEvent?.gallery || []).map((url, idx) => ({ url, name: `Photo ${idx + 1}` }));
  }, [currentHomeEvent]);

  const eventParticipants = useMemo(() => {
    if (!currentHomeEvent || !partData) return [];
    const targetY = normalize(currentHomeEvent.year);
    const targetM = robustNormalizeMonth(currentHomeEvent.month).toLowerCase();
    return partData.filter(p => normalize(p.year) === targetY && robustNormalizeMonth(p.month).toLowerCase() === targetM);
  }, [partData, currentHomeEvent]);

  const filteredParticipants = useMemo(() => {
    let list = [...eventParticipants];

    if (rosterFilter === 'In-person') list = list.filter(p => p.attendanceType === 'In-person');
    else if (rosterFilter === 'Remote') list = list.filter(p => p.attendanceType === 'Remote');
    else if (rosterFilter === 'Absent') list = list.filter(p => !p.attendanceType);

    if (rosterSearch.trim()) {
      list = list.filter(p => (p.participantName || "").toLowerCase().includes(rosterSearch.toLowerCase()));
    }

    return list.sort((a, b) => (a.participantName || "").localeCompare(b.participantName || ""));
  }, [eventParticipants, rosterSearch, rosterFilter]);

  const eventTotalPresent = useMemo(() => eventParticipants.filter(p => p.attendanceType).length, [eventParticipants]);
  const eventTotalAbsent = Math.max(0, eventParticipants.length - (currentHomeEvent?.inPerson || 0) - (currentHomeEvent?.remote || 0));

  const [execSummary, setExecSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const handleGenerateSummary = async () => {
    if (!currentHomeEvent) return;
    setIsSummarizing(true);
    try {
      const prompt = `Produce a structured executive summary for the event "${currentHomeEvent.theme}". 
Data: 
- Attendance: ${currentHomeEvent.attendance}%
- NPS: ${currentHomeEvent.nps}
- Insightful Score: ${currentHomeEvent.insightful}
- Logistics Score: ${currentHomeEvent.logistics}
- Host: ${currentHomeEvent.host}
- Date: ${currentHomeEvent.month} ${currentHomeEvent.year}

Use this exact structure:
Event Summary
Provide 2 sentences summarizing the overall success of the event based on the metrics.
Strengths
List 1-2 positive highlights (e.g., high attendance, good NPS, or strong insightful score).
Risks
List 1-2 areas of concern or lower performance.
Actions
Provide 1-2 specific actionable recommendations for the next event based on this data.

Formatting rules:
Keep it factual and direct. Do not use markdown symbols like ### or **. Use plain text.`;
      
      const res = await callGemini(prompt);
      setExecSummary(res);
      addLog('info', 'AI Summary generated.');
    } catch (e) { setExecSummary("Error generating summary."); } finally { setIsSummarizing(false); }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    addLog('info', `Starting upload: ${file.name}`);
    const validExts = ['.heic', '.heif', '.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    if (!validExts.some(ext => fileName.endsWith(ext))) {
      addLog('error', 'Invalid format blocked'); setUploadStatus("Invalid Format"); return;
    }
    setUploadStatus("Uploading...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const targetName = `${currentHomeEvent.year}_${currentHomeEvent.month}_${file.name.replace(/\s+/g, '_')}`;
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'uploadImage', year: currentHomeEvent.year, month: currentHomeEvent.month, fileName: targetName, mimeType: file.type || 'image/jpeg', fileData: base64 })
        });
        const result = await response.json();
        if (result.status === 'success') {
          addLog('success', 'Uploaded successfully.', `URL: ${result.url}`);
          setUploadStatus("Success!"); 
          fetchAllData(); // Refresh to fetch newly appended gallery URL from DB
        } else { addLog('error', 'Upload failed', result.message); setUploadStatus("Error."); }
      } catch (err) { addLog('error', 'Network upload error', err.toString()); setUploadStatus("Error."); }
      setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { id: 'main', label: 'Overview', icon: LayoutDashboard },
    { id: 'insights', label: 'Insights & Planning', icon: TrendingUp },
    { id: 'participant', label: 'Engagement Tracker', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings, subItems: [ 
        { id: 'events', label: 'Event Details', icon: List }, 
        { id: 'data', label: 'Data Management', icon: Database },
        { id: 'debug', label: 'Debug Console', icon: Bug }
      ] 
    }
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8F8F8] font-sans" style={{ fontFamily: BRAND.font }}>
      <div className={`bg-white border-r border-[#EEEEEE] flex flex-col shrink-0 z-10 shadow-sm transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
        <div className={`p-6 border-b flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}>
          {isSidebarExpanded && <div className="font-black text-2xl tracking-tighter text-black">CEL<span className="font-light">FOCUS</span></div>}
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="text-[#9C9B9C] hover:text-black transition-colors shrink-0">
            <Menu size={24} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-1 overflow-x-hidden">
          {navItems.map((item, itemIdx) => {
            const IconComponent = item.icon;
            if (item.subItems) return (
              <div key={`nav-${item.id}-${itemIdx}`}>
                <button onClick={() => {
                  if (!isSidebarExpanded) { setIsSidebarExpanded(true); setIsSettingsOpen(true); } 
                  else { setIsSettingsOpen(!isSettingsOpen); }
                }} className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-4' : 'justify-center px-0'} py-3 text-[#636466] hover:bg-[#F8F8F8] font-medium rounded transition-all`}>
                  <div className="flex items-center gap-3">
                    <IconComponent size={20} className="text-[#9C9B9C] shrink-0" />
                    {isSidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                  </div>
                  {isSidebarExpanded && (isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </button>
                {isSidebarExpanded && isSettingsOpen && item.subItems.map((sub, subIdx) => {
                   const SubIcon = sub.icon;
                   return (
                     <button key={`subnav-${sub.id}-${subIdx}`} onClick={() => setActiveTab(sub.id)} className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 text-sm ${activeTab === sub.id ? 'bg-[#F8F8F8] text-[#ED1C24] font-bold border-r-4 border-[#ED1C24]' : 'text-[#636466] hover:bg-[#F8F8F8]'}`}>
                       <SubIcon size={16} className="shrink-0"/>
                       <span className="whitespace-nowrap">{sub.label}</span>
                     </button>
                   );
                })}
              </div>
            );
            return (
              <button key={`nav-${item.id}-${itemIdx}`} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center ${isSidebarExpanded ? 'px-4' : 'justify-center px-0'} gap-3 py-3 rounded transition-all ${activeTab === item.id ? 'bg-[#F8F8F8] text-[#ED1C24] font-bold border-r-4 border-[#ED1C24]' : 'text-[#636466] hover:bg-[#F8F8F8]'}`}>
                <IconComponent size={20} className="shrink-0" />
                {isSidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto">
        {isLoadingInitial && aggData.length === 0 ? <div className="h-full flex items-center justify-center font-black uppercase tracking-widest text-[#9C9B9C] animate-pulse">Loading Live Data...</div> : (
          <>
            {activeTab === 'main' && currentHomeEvent && (
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4 text-black">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black">Event Analysis</h1>
                    <select value={selectedHomeEventId === '' ? latestEventIdWithData : selectedHomeEventId} onChange={e => setSelectedHomeEventId(e.target.value)} className="border rounded px-3 py-1 text-sm font-bold bg-white text-[#ED1C24] outline-none">{completedEvents.map(e => <option key={`opt-ev-${e.id}`} value={e.id}>{e.month} {e.year}</option>)}</select>
                  </div>
                  <button onClick={handleGenerateSummary} disabled={isSummarizing} className="bg-black text-white px-5 py-2.5 rounded shadow-sm flex items-center gap-2 text-sm font-bold hover:bg-neutral-800 transition-all"><Sparkles size={16}/> AI Summary</button>
                </div>
                {execSummary && <Card className="p-6 border-l-4 border-l-[#ED1C24] relative animate-in slide-in-from-top"><button onClick={() => setExecSummary('')} className="absolute top-4 right-4 text-[#9C9B9C]"><X size={20}/></button><CleanAISummary text={execSummary} /></Card>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black font-black">
                  <Card className="p-5 border-l-4 border-l-[#ED1C24]"><div className="text-[10px] text-[#9C9B9C] uppercase">Attendance</div><div className="text-3xl mt-1">{currentHomeEvent.attendance}%</div><DeltaIndicator current={currentHomeEvent.attendance} previous={prevHomeEvent?.attendance}/></Card>
                  <Card className="p-5 border-l-4 border-l-black"><div className="text-[10px] text-[#9C9B9C] uppercase">NPS Score</div><div className="text-3xl mt-1">{currentHomeEvent.nps}</div><DeltaIndicator current={currentHomeEvent.nps} previous={prevHomeEvent?.nps}/></Card>
                  <Card className="p-5 border-l-4 border-l-[#494E5E]"><div className="text-[10px] text-[#9C9B9C] uppercase">Insightful</div><div className="text-3xl mt-1">{currentHomeEvent.insightful}</div></Card>
                  <Card className="p-5 border-l-4 border-l-[#9C9B9C]"><div className="text-[10px] text-[#9C9B9C] uppercase">Logistics</div><div className="text-3xl mt-1">{currentHomeEvent.logistics}</div></Card>
                </div>
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6 text-black">
                    <h3 className="text-lg font-black flex items-center gap-2"><ImageIcon size={20} className="text-[#ED1C24]" /> Event Gallery</h3>
                    <div className="flex items-center gap-4">{uploadStatus && <span className="text-[10px] font-black uppercase text-[#ED1C24] animate-pulse">{uploadStatus}</span>}</div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                    <label className={`flex-shrink-0 w-48 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer border-[#EEEEEE] hover:border-[#ED1C24] hover:bg-red-50`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}>
                      <Plus size={24} className="text-[#9C9B9C]" /><span className="text-[10px] font-black text-[#9C9B9C] uppercase mt-1 text-center">Upload HEIC/JPG/PNG</span>
                      <input type="file" className="hidden" accept=".heic, .heif, .jpg, .jpeg, .png" onChange={(e) => handleFileUpload(e.target.files[0])} />
                    </label>
                    {filteredPhotos.map((img, idx) => (
                      <div key={`photo-${idx}`} className="flex-shrink-0 w-48 h-32 relative group rounded-lg overflow-hidden border bg-gray-50 shadow-sm transition-transform hover:scale-[1.02]">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button onClick={() => setExpandedImage(img.url)} className="p-2 bg-white rounded-full hover:bg-[#ED1C24] hover:text-white transition-all"><MousePointer2 size={16} /></button>
                          <a href={img.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full hover:bg-[#ED1C24] hover:text-white transition-all"><Download size={16} /></a>
                        </div>
                      </div>
                    ))}
                    {filteredPhotos.length === 0 && (
                      <div className="flex-1 min-w-[200px] flex items-center text-[#9C9B9C] text-xs italic">
                        No photos added to this session yet.
                      </div>
                    )}
                  </div>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 min-h-[300px]"><h3 className="text-lg font-black mb-4 flex items-center gap-2"><Clock size={20} className="text-[#ED1C24]" /> Event Agenda</h3><ul className="space-y-2">{(currentHomeEvent.agenda || []).map((a, i) => (<li key={`agenda-${i}`} className="p-3 bg-[#F8F8F8] border rounded-sm text-xs font-black">{a.topic}<div className="text-[10px] text-[#9C9B9C] uppercase mt-1 font-bold">{a.speaker}</div></li>))}</ul></Card>
                    <Card className="flex flex-col">
                      <div className="p-5 border-b border-[#EEEEEE] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-black">
                        <div className="shrink-0">
                          <h3 className="text-lg font-black">Attendee Roster</h3>
                          <p className="text-[10px] font-black text-[#9C9B9C] uppercase tracking-wider">{eventTotalPresent} Present / {eventParticipants.length} Invited</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                          <div className="relative grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9B9C]" size={14} />
                            <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 border border-[#C7C8CA] rounded text-xs outline-none focus:border-[#ED1C24] transition-all" value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} />
                          </div>
                          <div className="flex bg-[#F8F8F8] p-1 rounded border shrink-0 overflow-x-auto no-scrollbar">
                            {['All', 'In-person', 'Remote', 'Absent'].map(tab => (
                              <button key={`filter-${tab}`} onClick={() => setRosterFilter(tab)} className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase rounded transition-all whitespace-nowrap ${rosterFilter === tab ? 'bg-white text-[#ED1C24] shadow-sm' : 'text-[#636466] hover:bg-white/50'}`}>{tab}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left text-xs font-bold">
                          <thead className="bg-[#F8F8F8] sticky top-0 border-b">
                            <tr><th className="py-3 px-5 text-[#9C9B9C] uppercase">Participant</th><th className="py-3 px-5 text-[#9C9B9C] uppercase">Status</th></tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredParticipants.map((p, i) => (
                              <tr key={`app-part-${p.id || i}`} className="hover:bg-[#F8F8F8]">
                                <td className="py-3 px-5">{p.participantName}</td>
                                <td className="py-3 px-5"><span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-black uppercase ${p.attendanceType === 'In-person' ? 'bg-[#EEEEEE] text-black' : p.attendanceType === 'Remote' ? 'bg-[#FF4F50]/10 text-[#ED1C24]' : 'bg-gray-100 text-[#9C9B9C] opacity-60'}`}>{p.attendanceType || 'Absent'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                  <Card className="p-6">
                    <h3 className="text-lg font-black mb-4 text-black">Participant Split</h3>
                    <div className="h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: 'In-person', value: currentHomeEvent.inPerson || 0 }, 
                            { name: 'Remote', value: currentHomeEvent.remote || 0 }, 
                            { name: 'Absent', value: eventTotalAbsent }
                          ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                            <Cell fill={BRAND.colors.secondary} />
                            <Cell fill={BRAND.colors.primary} />
                            <Cell fill="#C7C8CA" />
                          </Pie>
                          <RechartsTooltip/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4 text-black">
                        <span className="text-3xl font-black">{eventParticipants.length}</span>
                        <span className="text-[10px] font-bold text-[#9C9B9C] uppercase">Invited</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-[#EEEEEE]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-black whitespace-nowrap">
                        <div className="w-3 h-3 rounded-sm bg-black shrink-0"></div> <span>{currentHomeEvent.inPerson || 0}</span> In-person
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-black whitespace-nowrap">
                        <div className="w-3 h-3 rounded-sm bg-[#ED1C24] shrink-0"></div> <span>{currentHomeEvent.remote || 0}</span> Remote
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9C9B9C] whitespace-nowrap">
                        <div className="w-3 h-3 rounded-sm bg-[#C7C8CA] shrink-0"></div> <span>{eventTotalAbsent}</span> Absent
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            {activeTab === 'insights' && <InsightsPage completedEvents={completedEvents} brand={BRAND} />}
            {activeTab === 'participant' && <ParticipantTrackerPage partData={partData} aggData={aggData} />}
            {activeTab === 'events' && <EventManagementPage aggData={aggData} setAggData={setAggData} />}
            {activeTab === 'data' && <DataManagementPage aggData={aggData} partData={partData} fetchAllData={fetchAllData} isConnecting={isConnecting} connectionError={connectionError} webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl} />}
            {activeTab === 'debug' && <DebugConsolePage logs={logs} clearLogs={() => setLogs([])} />}
          </>
        )}
      </div>
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} className="max-w-full max-h-full object-contain rounded" alt="Full" />
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={24}/></button>
        </div>
      )}
    </div>
  );
}