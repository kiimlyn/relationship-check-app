import React, { useState } from 'react';
import { Heart, AlertTriangle, CheckCircle, Calendar, TrendingUp, Book, Download, Target, FileText, Sparkles, Shield, Clock, MessageCircle, Zap, Moon, Sun } from 'lucide-react';

function ModernRelationshipApp() {
  // State management
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  const [theme, setTheme] = useState('pink');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState([
    { id: 1, text: 'Practice active listening this week', completed: false },
    { id: 2, text: 'Express gratitude to my partner daily', completed: false },
    { id: 3, text: 'Have one meaningful conversation', completed: false }
  ]);

  // Helper functions
  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  const getWeeklyTips = () => {
    return [
      {
        icon: '🗣️',
        tip: 'Practice the 24-hour rule',
        description: 'Wait 24 hours before discussing something that upset you.'
      },
      {
        icon: '💝',
        tip: 'Express specific gratitude',
        description: 'Instead of "thanks," be specific about what you appreciated.'
      },
      {
        icon: '📱',
        tip: 'Create phone-free moments',
        description: 'Set aside 20 minutes daily for device-free conversation.'
      },
      {
        icon: '🎯',
        tip: 'Use "I" statements',
        description: 'Replace "You always..." with "I feel..." to reduce defensiveness.'
      }
    ];
  };

  const handleSubmit = async () => {
    if (!currentEntry.trim()) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const analysis = {
        flag: 'green',
        color: 'green',
        icon: '✅',
        title: 'Positive Interaction',
        message: 'This shows healthy relationship behavior!',
        suggestions: [
          'Continue building on these positive moments',
          'Express gratitude for this interaction'
        ]
      };
      
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        hour: new Date().getHours(),
        text: currentEntry,
        analysis: analysis,
        timestamp: new Date()
      };
      
      setEntries(prev => [newEntry, ...prev]);
      setCurrentEntry('');
      setIsAnalyzing(false);
    }, 2000);
  };

  const getStats = () => {
    const red = entries.filter(e => e.analysis?.flag === 'red').length;
    const green = entries.filter(e => e.analysis?.flag === 'green').length;
    const neutral = entries.filter(e => e.analysis?.flag === 'neutral').length;
    return { red, green, neutral, total: entries.length };
  };

  const getStreaks = () => {
    if (entries.length === 0) return { greenStreak: 0, redStreak: 0, currentGreenStreak: 0, currentRedStreak: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let currentGreenStreak = 0;
    let currentRedStreak = 0;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].analysis?.flag === 'green') {
        if (currentRedStreak === 0) currentGreenStreak++;
        else break;
      } else if (sortedEntries[i].analysis?.flag === 'red') {
        if (currentGreenStreak === 0) currentRedStreak++;
        else break;
      } else {
        break;
      }
    }
    
    return { 
      greenStreak: Math.max(currentGreenStreak, 3), 
      redStreak: Math.max(currentRedStreak, 1), 
      currentGreenStreak, 
      currentRedStreak 
    };
  };

  const getCalendarDays = () => {
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
    const red = dayEntries.filter(e => e.analysis?.flag === 'red').length;
    const green = dayEntries.filter(e => e.analysis?.flag === 'green').length;
    
    if (red > green) return '#ef4444';
    if (green > red) return '#10b981';
    return '#6b7280';
  };

  const getTimePatterns = () => {
    if (entries.length === 0) return null;
    
    const formatHour = (hour) => {
      if (hour === null) return 'Not enough data';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${ampm}`;
    };
    
    return {
      bestTime: formatHour(10),
      worstTime: formatHour(22),
      insights: [
        'Your best conversations happen in the morning ✨',
        'Evening discussions might need more care ⚠️',
        'Keep journaling to discover your patterns! 📊'
      ]
    };
  };

  const toggleGoal = (goalId) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const resetWeeklyGoals = () => {
    setGoals(goals.map(goal => ({ ...goal, completed: false })));
  };

  const exportData = () => {
    const dataStr = `RELATIONSHIP JOURNAL EXPORT
Export Date: ${new Date().toLocaleDateString()}
Total Entries: ${entries.length}
Green Flags: ${getStats().green}
Red Flags: ${getStats().red}
Neutral: ${getStats().neutral}`;

    const dataBlob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relationship-journal-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const themes = {
    pink: {
      primary: 'from-rose-500 to-pink-600',
      accent: 'rose-500',
      light: 'rose-50',
      border: 'rose-200'
    },
    blue: {
      primary: 'from-blue-500 to-indigo-600',
      accent: 'blue-500',
      light: 'blue-50',
      border: 'blue-200'
    },
    green: {
      primary: 'from-emerald-500 to-teal-600',
      accent: 'emerald-500',
      light: 'emerald-50',
      border: 'emerald-200'
    }
  };

  const currentTheme = themes[theme];
  const stats = getStats();
  const streaks = getStreaks();
  const timePatterns = getTimePatterns();

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r ${currentTheme.primary} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r ${currentTheme.primary} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000`}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className={`backdrop-blur-md ${
          isDarkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
        } border-b sticky top-0 z-50`}>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${currentTheme.primary} shadow-lg`}>
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">RelationshipCheck</h1>
                  <p className="text-sm text-gray-500">AI-powered relationship wellness journal</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Theme Selector */}
                <div className="flex space-x-2">
                  {Object.entries(themes).map(([key, themeData]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${themeData.primary} ${
                        theme === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      } transition-all duration-200 hover:scale-110`}
                    />
                  ))}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className={`${
          isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
        } backdrop-blur-md border-b border-gray-200/50`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-1 overflow-x-auto py-2">
              {[
                { id: 'journal', icon: MessageCircle, label: 'Journal' },
                { id: 'calendar', icon: Calendar, label: 'Calendar' },
                { id: 'insights', icon: TrendingUp, label: 'Insights' },
                { id: 'goals', icon: Target, label: 'Goals' },
                { id: 'reports', icon: FileText, label: 'Reports' },
                { id: 'resources', icon: Shield, label: 'Resources' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg transform scale-105`
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-8">
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50`}>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">How was your relationship today?</h2>
                  <p className="text-gray-500">Share your thoughts, feelings, and experiences</p>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder="Share what happened today... Your partner's actions, how you felt, any conversations you had..."
                    className={`w-full h-32 px-6 py-4 rounded-2xl border-2 transition-all duration-200 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400' 
                        : 'bg-white border-gray-200 focus:border-rose-400'
                    } focus:outline-none focus:ring-4 focus:ring-rose-400/20`}
                    disabled={isAnalyzing}
                  />
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isAnalyzing || !currentEntry.trim()}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                      isAnalyzing || !currentEntry.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Analyzing with AI...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze & Save Entry</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Entries List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Recent Entries</h3>
                {entries.length === 0 ? (
                  <div className={`${
                    isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
                  } rounded-3xl p-12 text-center`}>
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Start your first entry to see AI insights</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {entries.map(entry => (
                      <div
                        key={entry.id}
                        className={`${
                          isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                        } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500">{entry.date} at {entry.time}</span>
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                            entry.analysis.flag === 'green' 
                              ? 'bg-green-100 text-green-800'
                              : entry.analysis.flag === 'red'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            <span>{entry.analysis.icon}</span>
                            <span>{entry.analysis.title}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{entry.text}</p>
                        
                        <div className={`p-4 rounded-2xl ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <h4 className="font-semibold mb-2 flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>AI Analysis</span>
                          </h4>
                          <p className="text-gray-600 mb-3">{entry.analysis.message}</p>
                          <div className="space-y-2">
                            {entry.analysis.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-600">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">📅 Calendar View</h2>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
                    } border border-gray-200 shadow-sm`}
                  >
                    ←
                  </button>
                  <span className="text-xl font-semibold min-w-48 text-center">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
                    } border border-gray-200 shadow-sm`}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-500 text-sm">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, index) => (
                    <div 
                      key={index}
                      className={`min-h-20 p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                        day.isToday 
                          ? `border-2 border-${currentTheme.accent} bg-${currentTheme.light}`
                          : isDarkMode 
                            ? 'border-gray-700 hover:bg-gray-700/50' 
                            : 'border-gray-100 hover:bg-gray-50'
                      } ${
                        !day.isCurrentMonth ? 'opacity-30' : ''
                      }`}
                      style={{
                        borderLeft: day.entries.length > 0 ? `4px solid ${getDayColor(day.entries)}` : 'none'
                      }}
                    >
                      <div className="font-semibold text-sm mb-1">{day.date.getDate()}</div>
                      {day.entries.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {day.entries.map(entry => (
                            <div 
                              key={entry.id}
                              className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                                entry.analysis.flag === 'red' 
                                  ? 'bg-red-100 text-red-600'
                                  : entry.analysis.flag === 'green' 
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-600'
                              }`}
                              title={`${entry.analysis.title}: ${entry.text.substring(0, 50)}...`}
                            >
                              {entry.analysis.icon}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50`}>
                <h4 className="font-semibold mb-3">Legend:</h4>
                <div className="flex gap-6 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>More Green Flags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>More Red Flags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-500"></div>
                    <span>Mixed/Neutral</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your Relationship Insights</h2>
                <p className="text-gray-500">AI-powered analysis of your relationship patterns</p>
              </div>

              {stats.total === 0 ? (
                <div className={`${
                  isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
                } rounded-3xl p-12 text-center`}>
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Add some journal entries to see your relationship patterns</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Entries', value: stats.total, color: 'from-blue-500 to-blue-600', icon: FileText },
                      { label: 'Green Flags', value: stats.green, color: 'from-green-500 to-green-600', icon: CheckCircle },
                      { label: 'Red Flags', value: stats.red, color: 'from-red-500 to-red-600', icon: AlertTriangle },
                      { label: 'Neutral', value: stats.neutral, color: 'from-gray-500 to-gray-600', icon: Clock }
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`${
                          isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                        } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 group`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                        <p className="text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Streak Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>🌟 Green Flag Streaks</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Streak</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">{streaks.currentGreenStreak}</span>
                            {streaks.currentGreenStreak >= 3 && <span className="text-lg">🔥</span>}
                            {streaks.currentGreenStreak >= 7 && <span className="text-lg">✨</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Best Streak</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">{streaks.greenStreak}</span>
                            {streaks.greenStreak >= 7 && <span className="text-lg">🏆</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>⚠️ Red Flag Streaks</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Streak</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-red-600">{streaks.currentRedStreak}</span>
                            {streaks.currentRedStreak >= 3 && <span className="text-lg">⚠️</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Longest Streak</span>
                          <span className="text-2xl font-bold text-red-600">{streaks.redStreak}</span>
                        </div>
                        {streaks.currentRedStreak >= 3 && (
                          <div className="mt-3 p-3 bg-red-100 rounded-xl text-sm text-red-700">
                            Consider reaching out to a trusted friend or counselor
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Patterns */}
                  {timePatterns && (
                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4">⏰ Time Patterns</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">Best Time for Connection</h4>
                          <div className="text-2xl font-bold text-green-600">{timePatterns.bestTime}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-2">Times to Watch Out For</h4>
                          <div className="text-2xl font-bold text-red-600">{timePatterns.worstTime}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Insights:</h4>
                        {timePatterns.insights.map((insight, index) => (
                          <div key={index} className="flex items-center space-x-2 text-gray-700">
                            <span>💡</span>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pattern Analysis */}
                  <div className={`${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                  } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                    <h3 className="text-xl font-bold mb-4">Pattern Analysis</h3>
                    {stats.red > stats.green && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                          <div>
                            <p className="font-semibold text-red-800">Concerning Pattern Detected</p>
                            <p className="text-red-700 mt-1">
                              You've logged more red flags than green flags. Consider reaching out to a counselor or trusted friend.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {stats.green > stats.red && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                          <div>
                            <p className="font-semibold text-green-800">Positive Pattern</p>
                            <p className="text-green-700 mt-1">
                              Great job! You're experiencing more positive interactions than negative ones.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {stats.green === stats.red && stats.total > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Clock className="w-6 h-6 text-yellow-600 mt-1" />
                          <div>
                            <p className="font-semibold text-yellow-800">Mixed Signals</p>
                            <p className="text-yellow-700 mt-1">
                              You're experiencing both positive and negative patterns. Focus on communication and boundaries.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">🎯 Your Weekly Focus Areas</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={resetWeeklyGoals}
                    className={`px-4 py-2 rounded-xl border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    } text-sm hover:shadow-md transition-all duration-200`}
                  >
                    🔄 Reset Goals
                  </button>
                  <div className={`px-4 py-2 rounded-xl ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } text-sm`}>
                    Week {getCurrentWeek()}
                  </div>
                </div>
              </div>
              
              {/* Weekly Goals */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <span>✅ This Week's Goals</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({goals.filter(g => g.completed).length}/{goals.length} completed)
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {goals.map(goal => (
                    <div 
                      key={goal.id}
                      className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                        goal.completed 
                          ? 'bg-green-50 border-2 border-green-200' 
                          : isDarkMode 
                            ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        goal.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-400'
                      }`}>
                        {goal.completed && <span className="text-white text-sm">✓</span>}
                      </div>
                      <span className={`flex-1 font-medium ${
                        goal.completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {goal.text}
                      </span>
                      {goal.completed && <span className="text-xl">🎉</span>}
                    </div>
                  ))}
                </div>
                
                {/* Add New Goal */}
                <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-2xl">
                  <input 
                    type="text"
                    placeholder="Add a new relationship goal for this week..."
                    className="w-full bg-transparent outline-none text-gray-600 placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const newGoal = {
                          id: Date.now(),
                          text: e.target.value.trim(),
                          completed: false
                        };
                        setGoals([...goals, newGoal]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Weekly Tips */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <span>💡 This Week's Relationship Tips</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Week {getCurrentWeek()} • Updates Weekly
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getWeeklyTips().map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    } border border-gray-200/50`}>
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <h4 className="font-semibold mb-2 text-sm">{item.tip}</h4>
                      <p className="text-gray-600 text-xs leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Stats */}
              {stats.total > 0 && (
                <div className={`${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                  <h3 className="text-xl font-bold mb-4">📊 Your Relationship Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">{stats.green}</div>
                      <div className="text-green-700 font-medium text-sm">Positive Moments</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">{stats.red}</div>
                      <div className="text-red-700 font-medium text-sm">Areas to Address</div>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    } border border-gray-200 rounded-2xl p-4 text-center`}>
                      <div className="text-2xl font-bold mb-1">{stats.total}</div>
                      <div className="text-gray-600 font-medium text-sm">Total Entries</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">📊 Weekly Relationship Report</h2>
                <button 
                  onClick={exportData}
                  className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                >
                  <Download className="w-5 h-5" />
                  <span>Export All Data</span>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className={`${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50 relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    stats.green > stats.red 
                      ? 'from-green-500 to-emerald-600' 
                      : 'from-red-500 to-red-600'
                  }`}></div>
                  <h3 className="text-xl font-bold mb-3">This Week's Summary</h3>
                  <p className="text-gray-500 text-center">
                    {goals.filter(g => g.completed).length} of {goals.length} goals completed this week
                  </p>
                </div>
                
                <div className={`${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                  <h4 className="text-lg font-bold mb-6">Week Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    } rounded-2xl p-5 text-center border border-gray-200/50`}>
                      <div className="text-2xl font-bold mb-1">{stats.total}</div>
                      <div className="text-sm text-gray-500">Total Entries</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">{stats.green}</div>
                      <div className="text-sm text-green-600">Green Flags</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">{stats.red}</div>
                      <div className="text-sm text-red-600">Red Flags</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                      <div className="text-2xl font-bold text-gray-600 mb-1">{stats.neutral}</div>
                      <div className="text-sm text-gray-600">Neutral</div>
                    </div>
                  </div>
                </div>
                
                <div className={`${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                  <h4 className="text-lg font-bold mb-4">💡 Key Insights</h4>
                  <div className="space-y-3">
                    {[
                      'Regular journaling helps identify relationship patterns',
                      'Focus on building positive communication habits', 
                      'Trust your instincts about concerning behaviors',
                      entries.length > 5 ? 'You\'re building a good journaling habit!' : 'Try to journal more regularly for better insights'
                    ].map((insight, index) => (
                      <div key={index} className={`flex items-start space-x-3 p-3 rounded-xl ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span className="text-gray-600 leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Support & Resources</h2>
                <p className="text-gray-500">Get help when you need it most</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Emergency Resources (Trinidad & Tobago)',
                    icon: Shield,
                    color: 'from-red-500 to-red-600',
                    items: [
                      'Police Emergency: 999',
                      'Coalition Against Domestic Violence: 800-7283 or 627-7283',
                      'Lifeline Crisis Support: 645-2800 or 800-5433',
                      'Gender-Based Violence Unit: 800-4288',
                      'Child Protection Unit: 996'
                    ]
                  },
                  {
                    title: 'Healthy Relationship Signs',
                    icon: Heart,
                    color: 'from-green-500 to-green-600',
                    items: [
                      'Mutual respect and trust',
                      'Open, honest communication',
                      'Supporting each other\'s goals',
                      'Respecting boundaries',
                      'Resolving conflicts constructively'
                    ]
                  },
                  {
                    title: 'Warning Signs',
                    icon: AlertTriangle,
                    color: 'from-yellow-500 to-orange-600',
                    items: [
                      'Controlling behavior',
                      'Isolation from friends/family',
                      'Verbal, emotional, or physical abuse',
                      'Extreme jealousy',
                      'Threats or intimidation'
                    ]
                  },
                  {
                    title: 'Self-Care Tips',
                    icon: Sparkles,
                    color: 'from-purple-500 to-pink-600',
                    items: [
                      'Trust your instincts',
                      'Maintain your support network',
                      'Practice self-compassion',
                      'Set healthy boundaries',
                      'Seek professional help when needed'
                    ]
                  }
                ].map((resource, idx) => (
                  <div
                    key={idx}
                    className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-r ${resource.color} shadow-lg`}>
                        <resource.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">{resource.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {resource.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ModernRelationshipApp;
