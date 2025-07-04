import React, { useState } from 'react';
import { Heart, AlertTriangle, CheckCircle, Calendar, TrendingUp, Book, Download, Target, FileText } from 'lucide-react';
import { analyzeRelationshipEntry } from './services/gemini';
import './App.css';

function App() {
const [entries, setEntries] = useState(() => {
  const savedEntries = localStorage.getItem('journalEntries');
  return savedEntries ? JSON.parse(savedEntries) : [];
});
  const [currentEntry, setCurrentEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  console.log('Current activeTab:', activeTab);
  const [theme, setTheme] = useState('pink');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState([
    { id: 1, text: 'Practice active listening', completed: false, week: getCurrentWeek() },
    { id: 2, text: 'Express gratitude daily', completed: false, week: getCurrentWeek() },
    { id: 3, text: 'Have one meaningful conversation', completed: false, week: getCurrentWeek() }
  ]);

  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  // Simulated AI analysis function (fallback)
  const localAnalyzeEntry = async (text) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const lowerText = text.toLowerCase();
    
    // Red flag patterns - make them more flexible
    const redFlags = [
      'yell', 'scream', 'threw', 'hit', 'slam', 'threat', 'stupid', 'worthless', 
      'control', 'check my phone', 'isolat', 'forbid', 'called me names', 
      'silent treatment', 'ignor', 'punish', 'jealous', 'accus', 'doesn\'t trust',
      'lie', 'lying', 'lied', 'cheat', 'cheating'
    ];
    
    // Green flag patterns - make them more flexible  
    const greenFlags = [
      'listen', 'apologi', 'support', 'encourag', 'help', 'communicat', 
      'discuss', 'compromi', 'understand', 'celebrat', 'proud', 'respect', 
      'boundar', 'space', 'date', 'quality time', 'grateful', 'thank'
    ];
    
    const redFlagCount = redFlags.filter(flag => lowerText.includes(flag)).length;
    const greenFlagCount = greenFlags.filter(flag => lowerText.includes(flag)).length;
    
    let analysis = {
      flag: 'neutral',
      color: 'neutral',
      icon: '⚪',
      title: 'Neutral',
      message: 'This seems like a normal relationship interaction.',
      suggestions: ['Continue observing patterns', 'Practice open communication']
    };
    
    if (redFlagCount > 0) {
      analysis = {
        flag: 'red',
        color: 'red',
        icon: '🚩',
        title: 'Red Flag Detected',
        message: 'This behavior shows concerning patterns that may indicate an unhealthy dynamic.',
        suggestions: [
          'Consider talking to a trusted friend or counselor',
          'Document these incidents',
          'Remember that healthy relationships involve mutual respect',
          'National Domestic Violence Hotline: 1-800-799-7233'
        ]
      };
    } else if (greenFlagCount > 0) {
      analysis = {
        flag: 'green',
        color: 'green',
        icon: '✅',
        title: 'Green Flag',
        message: 'This shows positive relationship behaviors and healthy communication.',
        suggestions: [
          'Acknowledge and appreciate these positive moments',
          'Continue building on this healthy foundation',
          'Express gratitude to your partner'
        ]
      };
    }
    
    return analysis;
  };

  const analyzeEntry = async (text) => {
    try {
      return await analyzeRelationshipEntry(text);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to local analysis if API fails
      return localAnalyzeEntry(text);
    }
  };

  const handleSubmit = async () => {
    if (!currentEntry.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysis = await analyzeEntry(currentEntry);
      
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        hour: new Date().getHours(),
        text: currentEntry,
        analysis: analysis,
        timestamp: new Date()
      };
      
const updatedEntries = [newEntry, ...entries];
setEntries(updatedEntries);
localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      setCurrentEntry('');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const themes = {
    pink: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryLight: '#fdf2f8',
      primaryBorder: '#f9a8d4',
      accent: '#be185d'
    },
    blue: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#eff6ff',
      primaryBorder: '#93c5fd',
      accent: '#1d4ed8'
    },
    green: {
      primary: '#10b981',
      primaryHover: '#059669',
      primaryLight: '#ecfdf5',
      primaryBorder: '#6ee7b7',
      accent: '#047857'
    }
  };

  const currentTheme = themes[theme];

  const getStats = () => {
    const red = entries.filter(e => e.analysis.flag === 'red').length;
    const green = entries.filter(e => e.analysis.flag === 'green').length;
    const neutral = entries.filter(e => e.analysis.flag === 'neutral').length;
    return { red, green, neutral, total: entries.length };
  };

  const getStreaks = () => {
    if (entries.length === 0) return { greenStreak: 0, redStreak: 0, currentGreenStreak: 0, currentRedStreak: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Current streaks (from most recent)
    let currentGreenStreak = 0;
    let currentRedStreak = 0;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].analysis.flag === 'green') {
        if (currentRedStreak === 0) currentGreenStreak++;
        else break;
      } else if (sortedEntries[i].analysis.flag === 'red') {
        if (currentGreenStreak === 0) currentRedStreak++;
        else break;
      } else {
        break; // Neutral breaks streaks
      }
    }
    
    // Longest streaks ever
    let longestGreen = 0;
    let longestRed = 0;
    let tempGreen = 0;
    let tempRed = 0;
    
    sortedEntries.reverse().forEach(entry => {
      if (entry.analysis.flag === 'green') {
        tempGreen++;
        tempRed = 0;
        longestGreen = Math.max(longestGreen, tempGreen);
      } else if (entry.analysis.flag === 'red') {
        tempRed++;
        tempGreen = 0;
        longestRed = Math.max(longestRed, tempRed);
      } else {
        tempGreen = 0;
        tempRed = 0;
      }
    });
    
    return { 
      greenStreak: longestGreen, 
      redStreak: longestRed, 
      currentGreenStreak, 
      currentRedStreak 
    };
  };

  const exportData = () => {
    const dataToExport = {
      exportDate: new Date().toLocaleDateString(),
      totalEntries: entries.length,
      entries: entries.map(entry => ({
        date: entry.date,
        time: entry.time,
        text: entry.text,
        analysis: entry.analysis.title,
        message: entry.analysis.message
      })),
      statistics: getStats(),
      streaks: getStreaks()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([`RELATIONSHIP JOURNAL EXPORT
Export Date: ${new Date().toLocaleDateString()}

SUMMARY:
Total Entries: ${entries.length}
Green Flags: ${getStats().green}
Red Flags: ${getStats().red}
Neutral: ${getStats().neutral}

ENTRIES:
${entries.map(entry => `
Date: ${entry.date} at ${entry.time}
Entry: ${entry.text}
Analysis: ${entry.analysis.title} - ${entry.analysis.message}
---`).join('')}

STATISTICS:
${JSON.stringify(getStats(), null, 2)}

STREAKS:
${JSON.stringify(getStreaks(), null, 2)}
`], { type: 'text/plain' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relationship-journal-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateWeeklyReport = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekEntries = entries.filter(entry => new Date(entry.timestamp) >= oneWeekAgo);
    const weekStats = {
      total: weekEntries.length,
      red: weekEntries.filter(e => e.analysis.flag === 'red').length,
      green: weekEntries.filter(e => e.analysis.flag === 'green').length,
      neutral: weekEntries.filter(e => e.analysis.flag === 'neutral').length
    };

    if (weekStats.total === 0) {
      return {
        summary: "No entries this week - try to journal more regularly!",
        insights: ["Consider setting a daily reminder to journal", "Even short entries can provide valuable insights"],
        trend: "neutral"
      };
    }

    let summary = `This week you made ${weekStats.total} entries. `;
    let trend = "neutral";
    let insights = [];

    if (weekStats.green > weekStats.red) {
      summary += `Great job! You had ${weekStats.green} positive interactions and only ${weekStats.red} concerning ones.`;
      trend = "positive";
      insights.push("Your relationship is showing healthy patterns this week!");
      insights.push("Keep up the positive communication and support.");
    } else if (weekStats.red > weekStats.green) {
      summary += `This week was challenging with ${weekStats.red} red flags and ${weekStats.green} green flags.`;
      trend = "concerning";
      insights.push("Consider what factors might be contributing to conflicts.");
      insights.push("It might be helpful to talk to a counselor or trusted friend.");
    } else {
      summary += `You had a mixed week with ${weekStats.green} positive and ${weekStats.red} concerning interactions.`;
      insights.push("Focus on building more positive moments together.");
      insights.push("Communication and setting boundaries can help.");
    }

    return { summary, insights, trend, stats: weekStats };
  };

  const toggleGoal = (goalId) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const addGoal = (text) => {
    const newGoal = {
      id: Date.now(),
      text,
      completed: false,
      week: getCurrentWeek()
    };
    setGoals([...goals, newGoal]);
  };

  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === current.toDateString();
      });
      
      days.push({
        date: new Date(current),
        entries: dayEntries,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getDayColor = (dayEntries) => {
    if (dayEntries.length === 0) return 'transparent';
    const red = dayEntries.filter(e => e.analysis.flag === 'red').length;
    const green = dayEntries.filter(e => e.analysis.flag === 'green').length;
    
    if (red > green) return 'var(--red-value)';
    if (green > red) return 'var(--green-value)';
    return 'var(--neutral-text)';
  };

  const getTimePatterns = () => {
    if (entries.length === 0) return null;
    
    const hourCounts = {};
    const hourFlags = {};
    
    // Initialize hour data
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = { total: 0, red: 0, green: 0, neutral: 0 };
      hourFlags[i] = [];
    }
    
    // Count entries by hour
    entries.forEach(entry => {
      const hour = entry.hour;
      if (hour !== undefined) {
        hourCounts[hour].total++;
        hourCounts[hour][entry.analysis.flag]++;
        hourFlags[hour].push(entry.analysis.flag);
      }
    });
    
    // Find best and worst times
    let bestHour = null;
    let worstHour = null;
    let highestGreenRatio = 0;
    let highestRedRatio = 0;
    
    Object.keys(hourCounts).forEach(hour => {
      const data = hourCounts[hour];
      if (data.total >= 2) { // Only consider hours with at least 2 entries
        const greenRatio = data.green / data.total;
        const redRatio = data.red / data.total;
        
        if (greenRatio > highestGreenRatio) {
          highestGreenRatio = greenRatio;
          bestHour = parseInt(hour);
        }
        
        if (redRatio > highestRedRatio) {
          highestRedRatio = redRatio;
          worstHour = parseInt(hour);
        }
      }
    });
    
    const formatHour = (hour) => {
      if (hour === null) return 'Not enough data';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${ampm}`;
    };
    
    // Generate insights
    const insights = [];
    
    if (bestHour !== null && highestGreenRatio > 0.6) {
      insights.push(`Your best conversations happen around ${formatHour(bestHour)} ✨`);
    }
    
    if (worstHour !== null && highestRedRatio > 0.5) {
      insights.push(`Conflicts tend to occur around ${formatHour(worstHour)} ⚠️`);
    }
    
    const morningEntries = entries.filter(e => e.hour >= 6 && e.hour < 12);
    const eveningEntries = entries.filter(e => e.hour >= 18 && e.hour < 24);
    
    if (morningEntries.length >= 3 && eveningEntries.length >= 3) {
      const morningGreenRatio = morningEntries.filter(e => e.analysis.flag === 'green').length / morningEntries.length;
      const eveningGreenRatio = eveningEntries.filter(e => e.analysis.flag === 'green').length / eveningEntries.length;
      
      if (morningGreenRatio > eveningGreenRatio + 0.2) {
        insights.push('You tend to have better interactions in the morning 🌅');
      } else if (eveningGreenRatio > morningGreenRatio + 0.2) {
        insights.push('Evening conversations tend to go better for you 🌙');
      }
    }
    
    if (entries.length >= 10) {
      const weekendEntries = entries.filter(e => {
        const day = new Date(e.timestamp).getDay();
        return day === 0 || day === 6;
      });
      const weekdayEntries = entries.filter(e => {
        const day = new Date(e.timestamp).getDay();
        return day >= 1 && day <= 5;
      });
      
      if (weekendEntries.length >= 3 && weekdayEntries.length >= 3) {
        const weekendGreenRatio = weekendEntries.filter(e => e.analysis.flag === 'green').length / weekendEntries.length;
        const weekdayGreenRatio = weekdayEntries.filter(e => e.analysis.flag === 'green').length / weekdayEntries.length;
        
        if (weekendGreenRatio > weekdayGreenRatio + 0.2) {
          insights.push('Your relationship is healthier on weekends 🎉');
        } else if (weekdayGreenRatio > weekendGreenRatio + 0.2) {
          insights.push('You connect better during weekdays 💼');
        }
      }
    }
    
    return {
      bestTime: formatHour(bestHour),
      worstTime: formatHour(worstHour),
      insights: insights.length > 0 ? insights : ['Keep journaling to discover your patterns! 📊']
    };
  };

  const stats = getStats();
  const streaks = getStreaks();
  const timePatterns = getTimePatterns();

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`} style={{
      '--theme-primary': currentTheme.primary,
      '--theme-primary-hover': currentTheme.primaryHover,
      '--theme-primary-light': currentTheme.primaryLight,
      '--theme-primary-border': currentTheme.primaryBorder,
      '--theme-accent': currentTheme.accent
    }}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Heart className="header-icon" />
          <h1>RelationshipCheck</h1>
        </div>
        <p className="header-subtitle">Your personal relationship wellness journal with AI insights</p>
        
        {/* Theme Controls */}
        <div className="theme-controls">
          <div className="theme-selector">
            <button 
              onClick={() => setTheme('pink')} 
              className={`theme-btn pink ${theme === 'pink' ? 'active' : ''}`}
              title="Pink Theme"
            />
            <button 
              onClick={() => setTheme('blue')} 
              className={`theme-btn blue ${theme === 'blue' ? 'active' : ''}`}
              title="Blue Theme"
            />
            <button 
              onClick={() => setTheme('green')} 
              className={`theme-btn green ${theme === 'green' ? 'active' : ''}`}
              title="Green Theme"
            />
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="dark-mode-toggle"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button
          onClick={() => setActiveTab('journal')}
          className={`nav-tab ${activeTab === 'journal' ? 'active' : ''}`}
        >
          <Calendar className="nav-icon" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <Calendar className="nav-icon" />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`nav-tab ${activeTab === 'insights' ? 'active' : ''}`}
        >
          <TrendingUp className="nav-icon" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
        >
          <Target className="nav-icon" />
          Goals
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <FileText className="nav-icon" />
          Reports
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`}
        >
          <Book className="nav-icon" />
          Resources
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'journal' && (
  <div className="journal-tab">
    {/* Entry Form */}
    <div className="entry-form">
      <h2>How was your relationship today?</h2>
      <div className="form-group">
        <textarea
          value={currentEntry}
          onChange={(e) => setCurrentEntry(e.target.value)}
          placeholder="Share what happened today... Your partner's actions, how you felt, any conversations you had..."
          className="entry-textarea"
          disabled={isAnalyzing}
        />
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !currentEntry.trim()}
          className="submit-btn"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze & Save Entry'}
        </button>
      </div>
    </div>

    {/* Entries List */}
    <div className="entries-list">
      {entries.length === 0 ? (
        <div className="empty-state">
          <Heart className="empty-icon" />
          <p>Start your first journal entry to get AI-powered insights</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            <div className="entry-header">
              <span className="entry-date">{entry.date} at {entry.time}</span>
              <span className={`entry-badge ${entry.analysis.color}`}>
                {entry.analysis.icon} {entry.analysis.title}
              </span>
            </div>
            
            <div className="entry-text">
              <p>{entry.text}</p>
            </div>
            
            <div className="entry-analysis">
              <h4>AI Analysis:</h4>
              <p className="analysis-message">{entry.analysis.message}</p>
              
              <div className="suggestions">
                <p className="suggestions-title">Suggestions:</p>
                {entry.analysis.suggestions.map((suggestion, index) => (
                  <p key={index} className="suggestion-item">• {suggestion}</p>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
       {activeTab === 'goals' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        🎯 Your Weekly Focus Areas
      </h2>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      {/* AI Recommendations Based on Journal Data */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          🤖 AI Recommendations
        </h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {(() => {
            const stats = getStats();
            const recommendations = [];
            
            if (stats.total === 0) {
              recommendations.push({
                icon: '📝',
                title: 'Start Your Journey',
                message: 'Begin by journaling about your daily relationship interactions to get personalized insights.'
              });
            } else {
              if (stats.red > stats.green) {
                recommendations.push({
                  icon: '🔧',
                  title: 'Focus on Communication',
                  message: 'Your recent entries show some challenges. Consider practicing "I feel" statements and setting clear boundaries.'
                });
                recommendations.push({
                  icon: '💬',
                  title: 'Have a Heart-to-Heart',
                  message: 'Schedule a calm conversation about what\'s been bothering you both. Choose a good time when you\'re both relaxed.'
                });
              } else if (stats.green > stats.red) {
                recommendations.push({
                  icon: '✨',
                  title: 'Keep Building on Success',
                  message: 'Your relationship is showing positive patterns! Continue doing what\'s working and express gratitude for these moments.'
                });
                recommendations.push({
                  icon: '🌱',
                  title: 'Deepen Your Connection',
                  message: 'Try asking deeper questions like "What made you feel most loved this week?" or "What are you looking forward to?"'
                });
              } else {
                recommendations.push({
                  icon: '⚖️',
                  title: 'Balance and Consistency',
                  message: 'You\'re experiencing both positive and challenging moments. Focus on creating more predictable positive interactions.'
                });
              }
              
              if (stats.total >= 5) {
                const timePatterns = getTimePatterns();
                if (timePatterns && timePatterns.insights.length > 0) {
                  recommendations.push({
                    icon: '⏰',
                    title: 'Timing Matters',
                    message: timePatterns.insights[0]
                  });
                }
              }
            }
            
            return recommendations.map((rec, index) => (
              <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <span style={{fontSize: '1.5rem'}}>{rec.icon}</span>
                  <div>
                    <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px'}}>{rec.title}</h4>
                    <p style={{color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0}}>{rec.message}</p>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Weekly Relationship Tips */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          💡 This Week's Relationship Tips
        </h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
          {[
            {
              icon: '🗣️',
              tip: 'Practice the 24-hour rule',
              description: 'Wait 24 hours before discussing something that upset you. This helps you respond thoughtfully instead of reacting.'
            },
            {
              icon: '💝',
              tip: 'Express specific gratitude',
              description: 'Instead of "thanks," try "I really appreciated when you listened to me talk about my day without trying to fix anything."'
            },
            {
              icon: '📱',
              tip: 'Create phone-free moments',
              description: 'Set aside 20 minutes daily for device-free conversation. Even small moments of undivided attention matter.'
            },
            {
              icon: '🎯',
              tip: 'Use "I" statements',
              description: 'Replace "You always..." with "I feel..." to reduce defensiveness and improve communication.'
            }
          ].map((item, index) => (
            <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
              <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>{item.icon}</div>
              <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem'}}>{item.tip}</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, margin: 0}}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journal Insights */}
      {getStats().total > 0 && (
        <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
            📊 Your Relationship Patterns
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
            <div style={{padding: '16px', background: 'var(--green-bg)', borderRadius: '12px', border: '1px solid var(--green-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-value)', marginBottom: '4px'}}>{getStats().green}</div>
              <div style={{color: 'var(--green-text)', fontWeight: '500'}}>Positive Moments</div>
            </div>
            <div style={{padding: '16px', background: 'var(--red-bg)', borderRadius: '12px', border: '1px solid var(--red-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-value)', marginBottom: '4px'}}>{getStats().red}</div>
              <div style={{color: 'var(--red-text)', fontWeight: '500'}}>Areas to Address</div>
            </div>
            <div style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>{getStats().total}</div>
              <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>Total Entries</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
{activeTab === 'calendar' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        📅 Calendar View
      </h2>
      <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
          style={{background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--text-primary)'}}
        >
          ←
        </button>
        <span style={{fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', minWidth: '200px', textAlign: 'center'}}>
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
          style={{background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--text-primary)'}}
        >
          →
        </button>
      </div>
    </div>

    <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '10px'}}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{padding: '10px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
            {day}
          </div>
        ))}
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)'}}>
        {(() => {
          const year = selectedDate.getFullYear();
          const month = selectedDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const startDate = new Date(firstDay);
          startDate.setDate(startDate.getDate() - firstDay.getDay());
          
          const days = [];
          const current = new Date(startDate);
          
          for (let i = 0; i < 42; i++) {
            const dayEntries = entries.filter(entry => {
              const entryDate = new Date(entry.timestamp);
              return entryDate.toDateString() === current.toDateString();
            });
            
            const isCurrentMonth = current.getMonth() === month;
            const isToday = current.toDateString() === new Date().toDateString();
            
            let borderColor = 'transparent';
            if (dayEntries.length > 0) {
              const red = dayEntries.filter(e => e.analysis.flag === 'red').length;
              const green = dayEntries.filter(e => e.analysis.flag === 'green').length;
              
              if (red > green) borderColor = 'var(--red-value)';
              else if (green > red) borderColor = 'var(--green-value)';
              else borderColor = 'var(--neutral-text)';
            }
            
            days.push(
              <div 
                key={i}
                style={{
                  background: 'var(--bg-primary)',
                  minHeight: '80px',
                  padding: '8px',
                  position: 'relative',
                  cursor: 'pointer',
                  borderLeft: dayEntries.length > 0 ? `4px solid ${borderColor}` : 'none',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  border: isToday ? '2px solid var(--theme-primary)' : 'none'
                }}
              >
                <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px'}}>
                  {current.getDate()}
                </div>
                {dayEntries.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '2px'}}>
                    {dayEntries.map(entry => (
                      <div 
                        key={entry.id}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          cursor: 'pointer',
                          background: entry.analysis.flag === 'red' ? 'var(--red-bg)' : entry.analysis.flag === 'green' ? 'var(--green-bg)' : 'var(--neutral-bg)',
                          color: entry.analysis.flag === 'red' ? 'var(--red-text)' : entry.analysis.flag === 'green' ? 'var(--green-text)' : 'var(--neutral-text)'
                        }}
                        title={`${entry.analysis.title}: ${entry.text.substring(0, 50)}...`}
                      >
                        {entry.analysis.icon}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
            
            current.setDate(current.getDate() + 1);
          }
          
          return days;
        })()}
      </div>
    </div>

    <div style={{marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px'}}>
      <h4 style={{color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '600'}}>Legend:</h4>
      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--green-value)'}}></span>
          More Green Flags
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--red-value)'}}></span>
          More Red Flags
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--neutral-text)'}}></span>
          Mixed/Neutral
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'goals' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        🎯 Relationship Goals
      </h2>
      <button 
        onClick={() => {
          const dataText = `RELATIONSHIP JOURNAL EXPORT\nExport Date: ${new Date().toLocaleDateString()}\n\nSUMMARY:\nTotal Entries: ${entries.length}\nGreen Flags: ${getStats().green}\nRed Flags: ${getStats().red}\nNeutral: ${getStats().neutral}\n\nENTRIES:\n${entries.map(entry => `\nDate: ${entry.date} at ${entry.time}\nEntry: ${entry.text}\nAnalysis: ${entry.analysis.title} - ${entry.analysis.message}\n---`).join('')}`;
          const dataBlob = new Blob([dataText], { type: 'text/plain' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `relationship-journal-${new Date().toISOString().split('T')[0]}.txt`;
          link.click();
          URL.revokeObjectURL(url);
        }}
        style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 2px 8px var(--shadow)'}}
      >
        📤 Export Data
      </button>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1.25rem', fontWeight: '600'}}>Weekly Goals</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {goals.map((goal, index) => (
  <div key={goal.id} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px'}}>
    <input 
      type="checkbox" 
      style={{width: '18px', height: '18px', cursor: 'pointer'}}
      checked={goal.completed}
      onChange={() => toggleGoal(goal.id)}
    />
    <span style={{flex: 1, color: 'var(--text-primary)', fontWeight: '500'}}>{goal.text}</span>
  </div>
))}
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'reports' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        📊 Weekly Relationship Report
      </h2>
      <button 
        onClick={() => {
          const dataText = `RELATIONSHIP JOURNAL EXPORT\nExport Date: ${new Date().toLocaleDateString()}\n\nSUMMARY:\nTotal Entries: ${entries.length}\nGreen Flags: ${getStats().green}\nRed Flags: ${getStats().red}\nNeutral: ${getStats().neutral}\n\nENTRIES:\n${entries.map(entry => `\nDate: ${entry.date} at ${entry.time}\nEntry: ${entry.text}\nAnalysis: ${entry.analysis.title} - ${entry.analysis.message}\n---`).join('')}`;
          const dataBlob = new Blob([dataText], { type: 'text/plain' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `relationship-journal-${new Date().toISOString().split('T')[0]}.txt`;
          link.click();
          URL.revokeObjectURL(url);
        }}
        style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 2px 8px var(--shadow)'}}
      >
        📤 Export All Data
      </button>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: entries.filter(e => e.analysis.flag === 'green').length > entries.filter(e => e.analysis.flag === 'red').length ? 'linear-gradient(90deg, #10b981, #047857)' : 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.25rem', fontWeight: '600'}}>This Week's Summary</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center'}}>
  {goals.filter(g => g.completed).length} of {goals.length} goals completed this week
</p>
      </div>
      
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '20px', fontWeight: '600'}}>Week Statistics</h4>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px'}}>
          <div style={{background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--border-color)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>{getStats().total}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Total Entries</div>
          </div>
          <div style={{background: 'var(--green-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--green-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-value)', marginBottom: '4px'}}>{getStats().green}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--green-text)'}}>Green Flags</div>
          </div>
          <div style={{background: 'var(--red-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--red-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-value)', marginBottom: '4px'}}>{getStats().red}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--red-text)'}}>Red Flags</div>
          </div>
          <div style={{background: 'var(--neutral-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--neutral-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--neutral-text)', marginBottom: '4px'}}>{getStats().neutral}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--neutral-text)'}}>Neutral</div>
          </div>
        </div>
      </div>
      
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '600'}}>💡 Key Insights</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {[
            'Regular journaling helps identify relationship patterns',
            'Focus on building positive communication habits', 
            'Trust your instincts about concerning behaviors',
            entries.length > 5 ? 'You\'re building a good journaling habit!' : 'Try to journal more regularly for better insights'
          ].map((insight, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px'}}>
              <span style={{color: 'var(--theme-primary)', fontWeight: 'bold', marginTop: '2px'}}>•</span>
              <span style={{color: 'var(--text-secondary)', lineHeight: 1.5}}>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <h2>Your Relationship Insights</h2>
            
            {stats.total === 0 ? (
              <div className="empty-state">
                <TrendingUp className="empty-icon" />
                <p>Add some journal entries to see your relationship patterns</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.green}</div>
                    <div className="text-sm text-green-600">Green Flags</div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-red-600">{stats.red}</div>
                    <div className="text-sm text-red-600">Red Flags</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-600">{stats.neutral}</div>
                    <div className="text-sm text-gray-600">Neutral</div>
                  </div>
                </div>

                {/* 🔥 NEW STREAK COUNTERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">🌟 Green Flag Streaks</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Current Streak:</span>
                        <span className="font-bold text-green-800">
                          {streaks.currentGreenStreak} day{streaks.currentGreenStreak !== 1 ? 's' : ''}
                          {streaks.currentGreenStreak >= 3 ? ' 🔥' : ''}
                          {streaks.currentGreenStreak >= 7 ? ' ✨' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Best Streak:</span>
                        <span className="font-bold text-green-800">
                          {streaks.greenStreak} day{streaks.greenStreak !== 1 ? 's' : ''}
                          {streaks.greenStreak >= 7 ? ' 🏆' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Red Flag Streaks</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-700">Current Streak:</span>
                        <span className="font-bold text-red-800">
                          {streaks.currentRedStreak} day{streaks.currentRedStreak !== 1 ? 's' : ''}
                          {streaks.currentRedStreak >= 3 ? ' ⚠️' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Longest Streak:</span>
                        <span className="font-bold text-red-800">
                          {streaks.redStreak} day{streaks.redStreak !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {streaks.currentRedStreak >= 3 && (
                        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                          Consider reaching out to a trusted friend or counselor
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 🔥 NEW TIME PATTERNS */}
                {timePatterns && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ Time Patterns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Best Time for Connection</h4>
                        <div className="text-2xl font-bold text-green-600">{timePatterns.bestTime}</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Watch Out Around</h4>
                        <div className="text-2xl font-bold text-red-600">{timePatterns.worstTime}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Insights:</h4>
                      {timePatterns.insights.map((insight, index) => (
                        <div key={index} className="flex items-center text-gray-700">
                          <span className="mr-2">💡</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
{activeTab === 'goals' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        🎯 Your Weekly Focus Areas
      </h2>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      {/* AI Recommendations Based on Journal Data */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          🤖 AI Recommendations
        </h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {(() => {
            const stats = getStats();
            const recommendations = [];
            
            if (stats.total === 0) {
              recommendations.push({
                icon: '📝',
                title: 'Start Your Journey',
                message: 'Begin by journaling about your daily relationship interactions to get personalized insights.'
              });
            } else {
              if (stats.red > stats.green) {
                recommendations.push({
                  icon: '🔧',
                  title: 'Focus on Communication',
                  message: 'Your recent entries show some challenges. Consider practicing "I feel" statements and setting clear boundaries.'
                });
                recommendations.push({
                  icon: '💬',
                  title: 'Have a Heart-to-Heart',
                  message: 'Schedule a calm conversation about what\'s been bothering you both. Choose a good time when you\'re both relaxed.'
                });
              } else if (stats.green > stats.red) {
                recommendations.push({
                  icon: '✨',
                  title: 'Keep Building on Success',
                  message: 'Your relationship is showing positive patterns! Continue doing what\'s working and express gratitude for these moments.'
                });
                recommendations.push({
                  icon: '🌱',
                  title: 'Deepen Your Connection',
                  message: 'Try asking deeper questions like "What made you feel most loved this week?" or "What are you looking forward to?"'
                });
              } else {
                recommendations.push({
                  icon: '⚖️',
                  title: 'Balance and Consistency',
                  message: 'You\'re experiencing both positive and challenging moments. Focus on creating more predictable positive interactions.'
                });
              }
              
              if (stats.total >= 5) {
                const timePatterns = getTimePatterns();
                if (timePatterns && timePatterns.insights.length > 0) {
                  recommendations.push({
                    icon: '⏰',
                    title: 'Timing Matters',
                    message: timePatterns.insights[0]
                  });
                }
              }
            }
            
            return recommendations.map((rec, index) => (
              <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <span style={{fontSize: '1.5rem'}}>{rec.icon}</span>
                  <div>
                    <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px'}}>{rec.title}</h4>
                    <p style={{color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0}}>{rec.message}</p>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Weekly Relationship Tips */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          💡 This Week's Relationship Tips
        </h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
          {[
            {
              icon: '🗣️',
              tip: 'Practice the 24-hour rule',
              description: 'Wait 24 hours before discussing something that upset you. This helps you respond thoughtfully instead of reacting.'
            },
            {
              icon: '💝',
              tip: 'Express specific gratitude',
              description: 'Instead of "thanks," try "I really appreciated when you listened to me talk about my day without trying to fix anything."'
            },
            {
              icon: '📱',
              tip: 'Create phone-free moments',
              description: 'Set aside 20 minutes daily for device-free conversation. Even small moments of undivided attention matter.'
            },
            {
              icon: '🎯',
              tip: 'Use "I" statements',
              description: 'Replace "You always..." with "I feel..." to reduce defensiveness and improve communication.'
            }
          ].map((item, index) => (
            <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
              <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>{item.icon}</div>
              <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem'}}>{item.tip}</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, margin: 0}}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journal Insights */}
      {getStats().total > 0 && (
        <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
            📊 Your Relationship Patterns
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
            <div style={{padding: '16px', background: 'var(--green-bg)', borderRadius: '12px', border: '1px solid var(--green-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-value)', marginBottom: '4px'}}>{getStats().green}</div>
              <div style={{color: 'var(--green-text)', fontWeight: '500'}}>Positive Moments</div>
            </div>
            <div style={{padding: '16px', background: 'var(--red-bg)', borderRadius: '12px', border: '1px solid var(--red-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-value)', marginBottom: '4px'}}>{getStats().red}</div>
              <div style={{color: 'var(--red-text)', fontWeight: '500'}}>Areas to Address</div>
            </div>
            <div style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>{getStats().total}</div>
              <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>Total Entries</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
            {stats.total > 0 && (
              <div className="pattern-analysis">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Pattern Analysis</h3>
                <div className="pattern-content">
                  {stats.red > stats.green && (
                    <div className="pattern-alert red">
                      <div className="pattern-header">
                        <AlertTriangle className="pattern-icon" />
                        <p className="pattern-title">Concerning Pattern Detected</p>
                      </div>
                      <p className="pattern-message">
                        You've logged more red flags than green flags. Consider reaching out to a counselor or trusted friend.
                      </p>
                    </div>
                  )}
                  
                  {stats.green > stats.red && (
                    <div className="pattern-alert green">
                      <div className="pattern-header">
                        <CheckCircle className="pattern-icon" />
                        <p className="pattern-title">Positive Pattern</p>
                      </div>
                      <p className="pattern-message">
                        Great job! You're experiencing more positive interactions than negative ones.
                      </p>
                    </div>
                  )}
                  
                  {stats.green === stats.red && stats.total > 0 && (
                    <div className="pattern-alert yellow">
                      <p className="pattern-title">Mixed Signals</p>
                      <p className="pattern-message">
                        You're experiencing both positive and negative patterns. Focus on communication and boundaries.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resources-tab">
            <h2>Relationship Resources</h2>
            
            <div className="resources-grid">
             <div className="resource-card">
  <h3>Emergency Resources (Trinidad & Tobago)</h3>
  <div className="resource-content">
    <p><strong>Police Emergency:</strong> 999</p>
    <p><strong>Coalition Against Domestic Violence:</strong> 800-7283 or 627-7283</p>
    <p><strong>Lifeline Crisis Support:</strong> 645-2800 or 800-5433</p>
    <p><strong>Gender-Based Violence Unit:</strong> 800-4288</p>
    <p><strong>Child Protection Unit:</strong> 996</p>
  </div>
</div>
              
              <div className="resource-card">
                <h3>Healthy Relationship Signs</h3>
                <ul className="resource-list">
                  <li>• Mutual respect and trust</li>
                  <li>• Open, honest communication</li>
                  <li>• Supporting each other's goals</li>
                  <li>• Respecting boundaries</li>
                  <li>• Resolving conflicts constructively</li>
                </ul>
              </div>
              
              <div className="resource-card">
                <h3>Warning Signs</h3>
                <ul className="resource-list">
                  <li>• Controlling behavior</li>
                  <li>• Isolation from friends/family</li>
                  <li>• Verbal, emotional, or physical abuse</li>
                  <li>• Extreme jealousy</li>
                  <li>• Threats or intimidation</li>
                </ul>
              </div>
              
              <div className="resource-card">
                <h3>Self-Care Tips</h3>
                <ul className="resource-list">
                  <li>• Trust your instincts</li>
                  <li>• Maintain your support network</li>
                  <li>• Practice self-compassion</li>
                  <li>• Set healthy boundaries</li>
                  <li>• Seek professional help when needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;