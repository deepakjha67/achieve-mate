import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StatusBar, 
  Alert,
  Modal,
  Vibration
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Target, 
  Trophy, 
  Clock, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  X,
  Flame,
  Play,
  Pause,
  Square
} from 'lucide-react-native';

// --- COLORS ---
const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#ffd166',
  success: '#06d6a0',
  warning: '#ef476f',
  text: '#e9ecef',
  gray: '#6c757d',
  border: '#333333'
};

// --- HOOK ---
const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  useEffect(() => {
    const load = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) setStoredValue(JSON.parse(item));
      } catch (e) {}
    };
    load();
  }, [key]);
  const setValue = async (value) => {
    const val = value instanceof Function ? value(storedValue) : value;
    setStoredValue(val);
    await AsyncStorage.setItem(key, JSON.stringify(val));
  };
  return [storedValue, setValue];
};

// --- SUB-COMPONENTS ---
const ProgressCard = ({ label, percentage, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={styles.circleContainer}>
      <Text style={[styles.circleText, { color: color }]}>{percentage}%</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// --- MAIN SCREEN COMPONENTS ---
const Dashboard = ({ playlists, dailyGoals, streak, achievements }) => {
  const totalVideos = playlists.reduce((acc, p) => acc + p.videos.length, 0);
  const completedVideos = playlists.reduce((acc, p) => acc + p.videos.filter(v => v.completed).length, 0);
  const topicProgress = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);
  const todayGoals = dailyGoals.filter(g => g.date === new Date().toDateString());
  const goalProgress = todayGoals.length === 0 ? 0 : Math.round((todayGoals.filter(g => g.completed).length / todayGoals.length) * 100);
  const earned = achievements.filter(a => a.earned).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      <View style={styles.statsRow}>
        <ProgressCard label="Topics Done" percentage={topicProgress} color={COLORS.primary} />
        <ProgressCard label="Goals Done" percentage={goalProgress} color={COLORS.success} />
      </View>
      <Text style={styles.sectionTitle}>Recent Achievements</Text>
      <View style={styles.achievementGrid}>
        {earned.length > 0 ? earned.map(a => (
          <View key={a.id} style={styles.achievementBadge}>
            <Text style={{ fontSize: 24 }}>{a.icon}</Text>
            <Text style={styles.achievementName} numberOfLines={1}>{a.name}</Text>
          </View>
        )) : <Text style={styles.emptyText}>No achievements yet.</Text>}
      </View>
      <Text style={styles.sectionTitle}>Today's Focus</Text>
      {todayGoals.length === 0 ? <Text style={styles.emptyText}>No goals set.</Text> : todayGoals.map(goal => (
        <View key={goal.id} style={[styles.goalItem, { borderLeftColor: COLORS.primary }]}>
          <View style={[styles.checkbox, goal.completed && { backgroundColor: COLORS.success, borderColor: COLORS.success }]}>
            {goal.completed && <CheckCircle size={14} color="white" />}
          </View>
          <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>{goal.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const Courses = ({ playlists, setPlaylists, updateStreak }) => {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [source, setSource] = useState('YouTube');
  const [videoInput, setVideoInput] = useState('');
  const [expanded, setExpanded] = useState(null);

  const addPlaylist = () => {
    const videos = videoInput.split('\n').filter(v => v.trim()).map((t, i) => ({ id: Date.now() + i, title: t.trim(), completed: false }));
    setPlaylists([...playlists, { id: Date.now(), name, source, videos, progress: 0 }]);
    setModal(false); setName(''); setVideoInput('');
  };

  const toggleVideo = (pId, vId) => {
    setPlaylists(playlists.map(p => {
      if (p.id !== pId) return p;
      const newVideos = p.videos.map(v => v.id === vId ? { ...v, completed: !v.completed } : v);
      const prog = Math.round((newVideos.filter(v => v.completed).length / newVideos.length) * 100);
      if (prog > p.progress) updateStreak();
      return { ...p, videos: newVideos, progress: prog };
    }));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Courses</Text>
        <TouchableOpacity onPress={() => setModal(true)} style={styles.addButton}>
          <Plus size={20} color="white" /><Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {playlists.length === 0 ? <Text style={styles.emptyText}>No playlists found.</Text> : playlists.map(p => (
          <View key={p.id} style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(expanded === p.id ? null : p.id)}>
              <View style={styles.progressCircleSmall}><Text style={styles.progressTextSmall}>{Math.round(p.progress)}%</Text></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardSubtitle}>{p.source} • {p.videos.filter(v => v.completed).length}/{p.videos.length}</Text>
              </View>
              <TouchableOpacity onPress={() => setPlaylists(playlists.filter(pl => pl.id !== p.id))}><Trash2 size={18} color={COLORS.warning} /></TouchableOpacity>
            </TouchableOpacity>
            {expanded === p.id && (
              <View style={styles.cardBody}>
                {p.videos.map(v => (
                  <TouchableOpacity key={v.id} style={styles.videoItem} onPress={() => toggleVideo(p.id, v.id)}>
                    <View style={[styles.checkbox, v.completed && { backgroundColor: COLORS.success, borderColor: COLORS.success }]}>
                      {v.completed && <CheckCircle size={14} color="white" />}
                    </View>
                    <Text style={[styles.videoText, v.completed && styles.goalTextCompleted]}>{v.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${p.progress}%`, backgroundColor: COLORS.primary }]} /></View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>New Playlist</Text><TouchableOpacity onPress={() => setModal(false)}><X size={24} color="white" /></TouchableOpacity></View>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.gray} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { height: 100 }]} placeholder="Videos (One per line)" placeholderTextColor={COLORS.gray} multiline value={videoInput} onChangeText={setVideoInput} />
            <TouchableOpacity style={styles.saveButton} onPress={addPlaylist}><Text style={styles.saveButtonText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Goals = ({ goals, setGoals }) => {
  const [text, setText] = useState('');
  const today = new Date().toDateString();
  const todayGoals = goals.filter(g => g.date === today);

  const addGoal = () => {
    if (!text.trim()) return;
    setGoals([...goals, { id: Date.now(), title: text, completed: false, date: today }]);
    setText('');
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.headerTitle}>Goals</Text>
      <Text style={styles.dateText}>{today}</Text>
      <View style={styles.addGoalRow}>
        <TextInput style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]} placeholder="New Goal..." placeholderTextColor={COLORS.gray} value={text} onChangeText={setText} />
        <TouchableOpacity style={styles.smallButton} onPress={addGoal}><Plus size={24} color="white" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {todayGoals.map(g => (
          <View key={g.id} style={styles.goalCard}>
            <TouchableOpacity style={styles.goalContent} onPress={() => setGoals(goals.map(gl => gl.id === g.id ? { ...gl, completed: !gl.completed } : gl))}>
              <View style={[styles.checkbox, g.completed && { backgroundColor: COLORS.success, borderColor: COLORS.success }]}>
                {g.completed && <CheckCircle size={16} color="white" />}
              </View>
              <Text style={[styles.goalTextLarge, g.completed && styles.goalTextCompleted]}>{g.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGoals(goals.filter(gl => gl.id !== g.id))}><Trash2 size={20} color={COLORS.gray} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const Focus = ({ addSession }) => {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dur, setDur] = useState(25);
  const [time, setTime] = useState(25 * 60);
  const [task, setTask] = useState('');

  useEffect(() => {
    let int = null;
    if (active && !paused && time > 0) int = setInterval(() => setTime(t => t - 1), 1000);
    else if (time === 0 && active) {
      setActive(false); Vibration.vibrate(); addSession({ date: new Date().toISOString(), dur, task }); Alert.alert("Done!"); setTime(dur * 60);
    }
    return () => clearInterval(int);
  }, [active, paused, time]);

  return (
    <View style={[styles.centerView, { padding: 20 }]}>
      <View style={styles.focusCard}>
        <Text style={styles.cardTitle}>Focus</Text>
        {!active ? (
          <View style={{ width: '100%', marginTop: 20 }}>
            <TextInput style={[styles.input, { textAlign: 'center' }]} placeholder="Task Name" placeholderTextColor={COLORS.gray} value={task} onChangeText={setTask} />
            <View style={styles.durationRow}>
              {[25, 45, 60].map(m => (
                <TouchableOpacity key={m} onPress={() => { setDur(m); setTime(m * 60); }} style={[styles.durationBtn, dur === m && { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.durationText}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : <Text style={{ color: COLORS.primary, fontSize: 18, marginTop: 20 }}>{task}</Text>}
        <Text style={styles.timerText}>{`${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`}</Text>
        <View style={styles.timerControls}>
          <TouchableOpacity onPress={() => { if (!active && !task) return Alert.alert("Task?"); if (!active) setActive(true); else setPaused(!paused); }} style={styles.playButton}>
            {active && !paused ? <Pause size={30} color="black" /> : <Play size={30} color="black" />}
          </TouchableOpacity>
          {active && <TouchableOpacity onPress={() => { setActive(false); setTime(dur * 60); }} style={styles.stopButton}><Square size={24} color="white" /></TouchableOpacity>}
        </View>
      </View>
    </View>
  );
};

// --- APP ---
export default function App() {
  const [tab, setTab] = useState('dash');
  const [streak, setStreak] = useAsyncStorage('streak', 0);
  const [playlists, setPlaylists] = useAsyncStorage('playlists', []);
  const [goals, setGoals] = useAsyncStorage('goals', []);
  const [focusHist, setFocusHist] = useAsyncStorage('focusHist', []);

  const achievements = [
    { id: 1, name: "Weekly Warrior", icon: "🔥", target: 7, type: 'streak' },
    { id: 2, name: "First Steps", icon: "💿", target: 1, type: 'playlist' },
    { id: 3, name: "Focus Master", icon: "🧠", target: 5, type: 'focus' },
    { id: 4, name: "Task Slayer", icon: "⚔️", target: 10, type: 'goals' },
  ].map(b => {
    let cur = 0;
    if (b.type === 'streak') cur = streak;
    if (b.type === 'playlist') cur = playlists.length;
    if (b.type === 'focus') cur = focusHist.length;
    if (b.type === 'goals') cur = goals.filter(g => g.completed).length;
    return { ...b, earned: cur >= b.target };
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.topHeader}>
        <Text style={styles.logoText}>Achieve-mate</Text>
        <View style={styles.streakBadge}><Flame size={16} color={COLORS.accent} /><Text style={styles.streakText}>{streak} Days</Text></View>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        {tab === 'dash' && <Dashboard playlists={playlists} dailyGoals={goals} streak={streak} achievements={achievements} />}
        {tab === 'courses' && <Courses playlists={playlists} setPlaylists={setPlaylists} updateStreak={() => setStreak(streak + 1)} />}
        {tab === 'goals' && <Goals goals={goals} setGoals={setGoals} />}
        {tab === 'focus' && <Focus addSession={s => setFocusHist([...focusHist, s])} />}
      </View>
      <View style={styles.bottomNav}>
        {[
          { id: 'dash', icon: LayoutDashboard, label: 'Home' },
          { id: 'courses', icon: PlayCircle, label: 'Courses' },
          { id: 'goals', icon: Target, label: 'Goals' },
          { id: 'focus', icon: Clock, label: 'Focus' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={styles.navItem} onPress={() => setTab(t.id)}>
            <t.icon size={24} color={tab === t.id ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.navLabel, { color: tab === t.id ? COLORS.primary : COLORS.gray }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  logoText: { color: COLORS.accent, fontSize: 20, fontWeight: 'bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 209, 102, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  streakText: { color: COLORS.accent, marginLeft: 5, fontWeight: 'bold' },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 0.48, backgroundColor: COLORS.card, padding: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
  circleContainer: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  circleText: { fontWeight: 'bold', fontSize: 16 },
  statLabel: { color: COLORS.gray, fontSize: 12, marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  emptyText: { color: COLORS.gray, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  achievementBadge: { width: '48%', backgroundColor: COLORS.card, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  achievementName: { color: COLORS.text, marginTop: 5, fontSize: 12, fontWeight: 'bold' },
  goalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.gray, marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  goalText: { color: COLORS.text, fontSize: 14 },
  goalTextCompleted: { color: COLORS.gray, textDecorationLine: 'line-through' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addButton: { backgroundColor: COLORS.primary, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: 'white', marginLeft: 5, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.card, borderRadius: 15, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  progressCircleSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  progressTextSmall: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: COLORS.gray, fontSize: 12 },
  cardBody: { padding: 15, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: COLORS.border },
  videoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  videoText: { color: COLORS.text, flex: 1 },
  progressBarBg: { height: 4, backgroundColor: COLORS.border, width: '100%' },
  progressBarFill: { height: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#121212', borderRadius: 10, padding: 15, color: COLORS.text, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  dateText: { color: COLORS.gray, marginBottom: 20 },
  addGoalRow: { flexDirection: 'row', marginBottom: 20 },
  smallButton: { backgroundColor: COLORS.warning, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  goalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  goalContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalTextLarge: { color: COLORS.text, fontSize: 16 },
  focusCard: { backgroundColor: COLORS.card, width: '100%', padding: 30, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  timerText: { color: COLORS.text, fontSize: 60, fontWeight: 'bold', marginVertical: 30, fontFamily: 'monospace' },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  durationBtn: { padding: 10, borderRadius: 8, backgroundColor: '#121212', flex: 0.3, alignItems: 'center' },
  durationText: { color: COLORS.gray, fontWeight: 'bold' },
  timerControls: { flexDirection: 'row', gap: 20 },
  playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  stopButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.warning, justifyContent: 'center', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, position: 'absolute', bottom: 0, width: '100%' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, marginTop: 4 }
});