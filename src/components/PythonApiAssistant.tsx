/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  Brain, 
  Layers,
  Settings,
  Send,
  Sparkles,
  HelpCircle,
  Code
} from 'lucide-react';

interface PythonApiAssistantProps {
  onAddNotification: (title: string, message: string, type: 'booking' | 'payment' | 'question' | 'system') => void;
}

export default function PythonApiAssistant({ onAddNotification }: PythonApiAssistantProps) {
  // Config state
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('python_api_url') || 'http://localhost:8000';
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('python_api_key') || '';
  });
  const [isSaved, setIsSaved] = useState(false);

  // Test state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');

  // Sandbox 1: AI Explainer
  const [explainTopic, setExplainTopic] = useState('Explain how u-substitution works in Calculus');
  const [explainLevel, setExplainLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [explainStatus, setExplainStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [explainResult, setExplainResult] = useState<string>('');

  // Sandbox 2: Chat Stream
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hi! I am your Python API assistant. When you run your Python server locally or in Azure, we will talk in real-time!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatStatus, setChatStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  // Active sub-tab
  const [subTab, setSubTab] = useState<'tester' | 'explain' | 'chat' | 'code'>('tester');
  const [selectedFramework, setSelectedFramework] = useState<'fastapi' | 'flask'>('fastapi');
  const [copied, setCopied] = useState(false);

  // Save settings helper
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('python_api_url', apiUrl);
    localStorage.setItem('python_api_key', apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);

    onAddNotification(
      'Python Config Saved 💾',
      `Updated external Python API target to: ${apiUrl}. You can now run tests or chat with your server.`,
      'system'
    );
  };

  // Run connection test
  const runConnectionTest = async () => {
    setTestStatus('testing');
    setTestResult('');
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setTestStatus('success');
      setTestResult(JSON.stringify(data, null, 2));

      onAddNotification(
        'Python API Connected! ✅',
        `Successfully received response from your Python endpoint at ${apiUrl}/api/health`,
        'system'
      );
    } catch (err: any) {
      console.error('Python API Test Connection Failed:', err);
      setTestStatus('error');
      setTestResult(err.message || 'Connection refused or CORS error. Make sure your Python server is running and CORS is enabled.');
    }
  };

  // Run AI Explainer
  const runExplainRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopic.trim()) return;

    setExplainStatus('loading');
    setExplainResult('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${apiUrl}/api/explain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: explainTopic,
          level: explainLevel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setExplainStatus('success');
      setExplainResult(data.explanation || data.result || JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error('Explain request failed:', err);
      setExplainStatus('error');
      setExplainResult(`Failed to connect to ${apiUrl}/api/explain. Error: ${err.message}. Ensure your Python app is running and handles POST requests.`);
    }
  };

  // Run Chat Request
  const runChatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to history
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, time: timestamp }]);
    setChatInput('');
    setChatStatus('sending');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.response || data.reply || data.message || JSON.stringify(data);
      
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: botReply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      setChatStatus('idle');
    } catch (err: any) {
      console.error('Chat request failed:', err);
      setChatStatus('error');
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: `⚠️ Error communicating with ${apiUrl}/api/chat: ${err.message}. Make sure CORS is configured properly on your Python server.`, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      setChatStatus('idle');
    }
  };

  // Python Code Generation Snippets
  const fastapiCode = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="The Learning Collective API", description="Python backend for Study and AI help")

# 1. CRITICAL: Configure CORS so your React Frontend can communicate with your Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, specify your Azure App Service URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schemas
class ExplainRequest(BaseModel):
    topic: str
    level: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "provider": "Python (FastAPI)",
        "message": "Connected successfully to the Learning Collective React application!"
    }

@app.post("/api/explain")
def explain_topic(req: ExplainRequest):
    # Here you would integrate Azure OpenAI, Gemini, or custom heuristic explanations
    explanation_map = {
        "beginner": f"Hey there! Let's break down '{req.topic}' in super simple terms. Imagine you are sharing this with a friend. We take it step-by-step without complex formulas...",
        "intermediate": f"Let's look at '{req.topic}' from an educational perspective. Here are the core conceptual structures, standard formula representations, and visual examples...",
        "advanced": f"Rigorous proof-based breakdown of '{req.topic}'. We analyze the mathematical constraints, physical properties, and computational trade-offs of this specific paradigm..."
    }
    
    explanation = explanation_map.get(req.level, "A comprehensive educational review.")
    
    # Custom fallback examples
    if "u-substitution" in req.topic.lower() or "calculus" in req.topic.lower():
        explanation += "\\n\\nExample: ∫ (2x) / (x² + 1) dx.\\n1. Let u = x² + 1\\n2. Then du = 2x dx\\n3. Substitute: ∫ (1/u) du = ln|u| + C\\n4. Result: ln(x² + 1) + C"
        
    return {
        "topic": req.topic,
        "level": req.level,
        "explanation": explanation
    }

@app.post("/api/chat")
def chat_response(req: ChatRequest):
    # Basic interactive study guide logic
    msg = req.message.lower()
    if "hello" in msg or "hi" in msg:
        reply = "Hello! I am your Python-powered study buddy. Ask me any math, science, or programming questions!"
    elif "math" in msg or "calculus" in msg:
        reply = "Mathematics is the language of nature! I can help you with integration, derivative rules, or coordinate geometry."
    elif "python" in msg or "code" in msg:
        reply = "Python is beautiful! To learn Python, start by practicing variables, list comprehensions, and dictionaries. Try writing 'print(\"Hello World\")'!"
    else:
        reply = f"I received your message: '{req.message}'. As your Python study companion, I am ready to help you analyze this topic further!"
        
    return {
        "reply": reply
    }

if __name__ == "__main__":
    import uvicorn
    # Run the server on localhost:8000
    uvicorn.run(app, host="0.0.0.0", port=8000)`;

  const flaskCode = `from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 1. CRITICAL: Configure CORS so your React Frontend can communicate with your Python backend
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "provider": "Python (Flask)",
        "message": "Connected successfully to the Learning Collective React application!"
    })

@app.route("/api/explain", methods=["POST"])
def explain_topic():
    data = request.json or {}
    topic = data.get("topic", "")
    level = data.get("level", "beginner")
    
    explanation = f"Welcome! This is a custom explanation generated from your Python Flask server. Level requested: {level}. Subject: {topic}."
    
    if "u-substitution" in topic.lower():
        explanation += "\\n\\nSteps:\\n1. Choose u\\n2. Calculate du\\n3. Substitute and integrate!"
        
    return jsonify({
        "topic": topic,
        "level": level,
        "explanation": explanation
    })

@app.route("/api/chat", methods=["POST"])
def chat_response():
    data = request.json or {}
    message = data.get("message", "")
    
    reply = f"Hello from Python Flask! I processed your prompt: '{message}'."
    return jsonify({
        "reply": reply
    })

if __name__ == "__main__":
    # Run server on port 8000
    app.run(host="0.0.0.0", port=8000, debug=True)`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFramework === 'fastapi' ? fastapiCode : flaskCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-bold text-sky-400">
            <Brain className="w-3.5 h-3.5 animate-pulse" />
            Azure Python Resource Integration
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-100 tracking-tight leading-tight">
            Connect Your Custom Python AI Assistant & APIs
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            Empower your Learning Collective portal by hooking up custom Python servers. Run Python locally or host it as an Azure App Service, then interface directly in real-time.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <a 
            href="https://learn.microsoft.com/en-us/azure/app-service/quickstart-python" 
            target="_blank" 
            rel="noreferrer" 
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-xl transition-all inline-flex items-center gap-1.5 shadow"
          >
            Deploy Python to Azure <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Column */}
        <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-2 border-b border-[#E6E2D3] pb-3">
            <Settings className="w-4 h-4 text-[#5F7161]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Connection Settings</h4>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">Python API Base URL</label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="e.g., http://localhost:8000"
                  className="w-full pl-8 pr-4 py-2.5 border border-[#E6E2D3] rounded-xl text-xs font-mono font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                />
                <Terminal className="w-3.5 h-3.5 absolute left-3 top-3.5 text-[#9A9483]" />
              </div>
              <p className="text-[10px] text-[#9A9483] font-medium leading-relaxed">
                Provide the address of your local Python server or deployed Azure App Service URL. No trailing slash.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">API Authentication Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter Bearer Token / API Secret"
                className="w-full px-3 py-2.5 border border-[#E6E2D3] rounded-xl text-xs font-mono font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
              />
              <p className="text-[10px] text-[#9A9483] font-medium leading-relaxed">
                Appended as an Authorization Bearer Header if provided.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-xs rounded-xl transition-all border border-[#5F7161] cursor-pointer shadow-sm text-center"
              >
                {isSaved ? 'Saved! ✓' : 'Save Connection'}
              </button>
            </div>
          </form>

          {/* Quick instructions / Help */}
          <div className="bg-[#FAF9F0] border border-[#E6E2D3] rounded-xl p-4 space-y-2">
            <h5 className="text-[11px] font-bold text-[#2D3A30] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#E7AB79]" />
              CORS Configuration Alert!
            </h5>
            <p className="text-[10px] text-neutral-600 font-semibold leading-relaxed">
              When building external APIs, browsers enforce <strong>CORS policies</strong>. Your Python code must include CORS headers allowing requests from your browser, or connections will be blocked. Use our template below!
            </p>
          </div>
        </div>

        {/* Workspace Column (Tabs) */}
        <div className="lg:col-span-2 bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
          
          {/* Sub-navigation bar */}
          <div className="flex border-b border-[#E6E2D3] pb-3 gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSubTab('tester')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'tester'
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'border-transparent text-[#9A9483] hover:text-[#2D3A30]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              1. Connection Tester
            </button>
            <button
              onClick={() => setSubTab('explain')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'explain'
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'border-transparent text-[#9A9483] hover:text-[#2D3A30]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              2. AI Homework Assistant
            </button>
            <button
              onClick={() => setSubTab('chat')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'chat'
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'border-transparent text-[#9A9483] hover:text-[#2D3A30]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              3. Study Buddy Chat
            </button>
            <button
              onClick={() => setSubTab('code')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'code'
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'border-transparent text-[#9A9483] hover:text-[#2D3A30]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Get Python Code
            </button>
          </div>

          {/* Sub-tab Content Area */}
          <div className="flex-1 pt-6 flex flex-col">
            
            {/* SUB-TAB 1: TESTER */}
            {subTab === 'tester' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-sm font-serif font-bold text-neutral-800">Verify Python Connection</h4>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Test the endpoint handshake. By default, it targets <code>GET {apiUrl}/api/health</code> to ensure there are no network restrictions or CORS anomalies.
                  </p>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={runConnectionTest}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2.5 bg-[#2D3A30] hover:bg-black text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {testStatus === 'testing' ? 'Testing Handshake...' : 'Run Handshake Test'}
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 mt-6 border border-[#E6E2D3] rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-auto max-h-[250px] relative">
                  <span className="absolute top-2 right-3 text-[9px] font-bold tracking-widest text-slate-500 uppercase">CONSOLE LOGS</span>
                  {testStatus === 'idle' && (
                    <p className="text-slate-400 italic font-medium">Ready to test connection. Click the button above to begin.</p>
                  )}
                  {testStatus === 'testing' && (
                    <div className="space-y-1">
                      <p className="text-yellow-400">⚡ Initializing handshake to {apiUrl}/api/health...</p>
                      <p className="text-slate-400">Sending headers: Content-Type: application/json</p>
                    </div>
                  )}
                  {testStatus === 'success' && (
                    <div className="space-y-2">
                      <p className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-4 h-4" /> SUCCESS! Connection Active.
                      </p>
                      <pre className="text-slate-300 whitespace-pre-wrap">{testResult}</pre>
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="space-y-2">
                      <p className="text-rose-400 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-4 h-4" /> HANDSHAKE FAILED.
                      </p>
                      <p className="text-slate-300 font-semibold">{testResult}</p>
                      <div className="mt-4 p-2 bg-slate-800 rounded border border-slate-700 text-[11px] text-slate-400 space-y-1">
                        <p className="font-bold text-slate-300">Troubleshooting checklist:</p>
                        <p>1. Is your server running locally on Python? (e.g. uvicorn main:app --reload)</p>
                        <p>2. Did you configure CORS middleware? (See "Get Python Code" tab)</p>
                        <p>3. If deployed on Azure, are public inbound requests allowed?</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: EXPLAIN */}
            {subTab === 'explain' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-neutral-800">AI Homework Explainer Sandbox</h4>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Test the <code>POST /api/explain</code> endpoint. Perfect for hooking up advanced mathematical proof logic or LLM capabilities on your Python server.
                  </p>
                </div>

                <form onSubmit={runExplainRequest} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Doubt Topic</label>
                      <input
                        type="text"
                        required
                        value={explainTopic}
                        onChange={(e) => setExplainTopic(e.target.value)}
                        placeholder="e.g. Mitosis vs Meiosis"
                        className="w-full px-3 py-2 border border-[#E6E2D3] rounded-xl text-xs font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Consultation Depth</label>
                      <select
                        value={explainLevel}
                        onChange={(e: any) => setExplainLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E6E2D3] rounded-xl text-xs font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                      >
                        <option value="beginner">Beginner (Simple Terms)</option>
                        <option value="intermediate">Intermediate (Standard Curriculum)</option>
                        <option value="advanced">Advanced (Rigorous Proofs)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={explainStatus === 'loading'}
                    className="px-4 py-2 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {explainStatus === 'loading' ? 'Analyzing via Python...' : 'Analyze Topic'}
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  </button>
                </form>

                {/* Explain Response Box */}
                <div className="flex-1 mt-4 border border-[#E6E2D3] bg-[#FDFCF8] rounded-xl p-4 min-h-[180px] overflow-auto">
                  {explainStatus === 'idle' && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                      <Brain className="w-8 h-8 text-[#9A9483]/50 mb-2" />
                      <p className="text-xs font-bold">Ready to consult Python server</p>
                      <p className="text-[10px] text-[#9A9483] mt-1 max-w-xs">Submit a topic above. We will send a POST payload with your topic and depth level!</p>
                    </div>
                  )}

                  {explainStatus === 'loading' && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9483]">
                      <div className="w-6 h-6 border-2 border-[#5F7161] border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-bold">Fetching analysis from your Python REST API...</p>
                    </div>
                  )}

                  {explainStatus === 'success' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-[#E6E2D3] pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          Python AI Response
                        </span>
                        <span className="text-[10px] font-semibold text-[#9A9483]">
                          Handled at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed font-semibold whitespace-pre-wrap">{explainResult}</p>
                    </div>
                  )}

                  {explainStatus === 'error' && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl space-y-2">
                      <p className="text-xs font-bold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-rose-600" /> Connection error
                      </p>
                      <p className="text-[11px] font-semibold leading-relaxed text-rose-700">{explainResult}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: CHAT */}
            {subTab === 'chat' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-neutral-800">Study Buddy Chat Sandbox</h4>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Chat with your Python service! It communicates with <code>POST {apiUrl}/api/chat</code> to let students talk to custom learning bots.
                  </p>
                </div>

                {/* Messages Window */}
                <div className="flex-1 my-3 border border-[#E6E2D3] bg-[#FAF9F5] rounded-xl p-4 overflow-y-auto max-h-[220px] space-y-3 flex flex-col">
                  {chatHistory.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`max-w-[80%] flex flex-col space-y-1 ${
                        chat.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div className={`p-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        chat.sender === 'user'
                          ? 'bg-[#5F7161] text-white rounded-br-none'
                          : 'bg-white text-neutral-800 border border-[#E6E2D3] rounded-bl-none'
                      }`}>
                        {chat.text}
                      </div>
                      <span className="text-[8px] text-[#9A9483] font-bold px-1">{chat.time}</span>
                    </div>
                  ))}
                  {chatStatus === 'sending' && (
                    <div className="self-start flex items-center gap-2 p-2 bg-white border border-[#E6E2D3] rounded-2xl text-neutral-500 text-[10px] font-bold animate-pulse">
                      <div className="w-1.5 h-1.5 bg-[#5F7161] rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#5F7161] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-[#5F7161] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Python companion replying...</span>
                    </div>
                  )}
                </div>

                {/* Form input */}
                <form onSubmit={runChatRequest} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type study topic or programming doubt..."
                    className="flex-1 px-4 py-2.5 border border-[#E6E2D3] rounded-xl text-xs font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                  />
                  <button
                    type="submit"
                    disabled={chatStatus === 'sending' || !chatInput.trim()}
                    className="p-3 bg-[#5F7161] hover:bg-[#4D5C4F] text-white rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* SUB-TAB 4: CODE */}
            {subTab === 'code' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-serif font-bold text-neutral-800">Copy Starter Python Server Code</h4>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                      Copy the template below, paste it into a file (e.g. <code>main.py</code>), and run it. It supports both local testing and Azure App deployments!
                    </p>
                  </div>
                  
                  {/* Selector framework */}
                  <div className="flex gap-1.5 bg-slate-100 p-1 border border-slate-200 rounded-lg shrink-0">
                    <button
                      onClick={() => setSelectedFramework('fastapi')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        selectedFramework === 'fastapi'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-[#9A9483] hover:text-[#2D3A30]'
                      }`}
                    >
                      FastAPI
                    </button>
                    <button
                      onClick={() => setSelectedFramework('flask')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        selectedFramework === 'flask'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-[#9A9483] hover:text-[#2D3A30]'
                      }`}
                    >
                      Flask
                    </button>
                  </div>
                </div>

                {/* Code Block Container */}
                <div className="flex-1 relative flex flex-col border border-slate-200 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">
                      {selectedFramework === 'fastapi' ? 'main.py (FastAPI Code Template)' : 'app.py (Flask Code Template)'}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? 'Copied! ✓' : 'Copy Code'}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <pre className="flex-1 p-4 overflow-auto max-h-[250px] leading-relaxed text-slate-300 select-all font-medium text-[11px]">
                    {selectedFramework === 'fastapi' ? fastapiCode : flaskCode}
                  </pre>
                </div>
                
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-[11px] text-sky-800 leading-relaxed font-semibold">
                  💡 <strong>Azure App Deployment Guide:</strong> Put this file into your GitHub repo, define a <code>requirements.txt</code> with <code>fastapi</code>, <code>uvicorn</code>, and <code>pydantic</code> (or <code>flask</code> and <code>flask-cors</code>), and Azure Web Apps will automatically detect the Python language, build your container, and host your REST endpoints securely!
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
