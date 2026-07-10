/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Code,
  Cpu,
  Database,
  RefreshCw,
  GitBranch,
  Lock,
  Shield,
  CreditCard,
  ChevronRight,
  Info,
  Sliders,
  Search,
  Trash,
  Eye,
  Github,
  UserCheck,
  Zap,
  Activity,
  HardDrive
} from 'lucide-react';

interface MicroservicesHubProps {
  onAddNotification: (title: string, message: string, type: 'booking' | 'payment' | 'question' | 'system') => void;
  currentUser: any;
}

export default function MicroservicesHub({ onAddNotification, currentUser }: MicroservicesHubProps) {
  // Main and sub-navigation tabs
  const [activeTab, setActiveTab] = useState<'aca' | 'redis' | 'cicd' | 'b2c' | 'python-ai'>('aca');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ==========================================
  // TAB 1: Azure Container Apps States
  // ==========================================
  const [autoscale, setAutoscale] = useState(true);
  const [acaLogs, setAcaLogs] = useState<string[]>([
    '[SYSTEM] ACA Environment successfully provisioned in East US 2.',
    '[SYSTEM] Ingress Controller active on port 443 with HTTPS redirection.',
    '[GATEWAY] Gateway controller balancing traffic across frontend containers.',
    '[INFO] Ready for connections.'
  ]);
  const [pods, setPods] = useState({
    gateway: [
      { id: 'gate-pod-1', status: 'Running', cpu: 12, memory: 180, uptime: '4d 12h' },
      { id: 'gate-pod-2', status: 'Running', cpu: 8, memory: 172, uptime: '2d 6h' }
    ],
    python: [
      { id: 'py-pod-1', status: 'Running', cpu: 18, memory: 310, uptime: '4d 12h' }
    ],
    stripe: [
      { id: 'stripe-pod-1', status: 'Running', cpu: 5, memory: 110, uptime: '4d 12h' }
    ]
  });

  const appendAcaLog = (message: string) => {
    setAcaLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const scaleUp = (service: 'gateway' | 'python' | 'stripe') => {
    const randomHex = Math.random().toString(16).substring(2, 6);
    const newPod = {
      id: `${service}-pod-${randomHex}`,
      status: 'Pending',
      cpu: 0,
      memory: 32,
      uptime: '0s'
    };

    setPods(prev => ({
      ...prev,
      [service]: [...prev[service], newPod]
    }));

    appendAcaLog(`KEDA Autoscale triggered. Initiating spin up for container pod: ${service}-pod-${randomHex}`);

    // Transition Pending to Running
    setTimeout(() => {
      setPods(prev => ({
        ...prev,
        [service]: prev[service].map(p => 
          p.id === `${service}-pod-${randomHex}` 
            ? { ...p, status: 'Running', cpu: Math.floor(Math.random() * 15) + 5, memory: service === 'python' ? 290 : 120, uptime: '10s' }
            : p
        )
      }));
      appendAcaLog(`Pod ${service}-pod-${randomHex} successfully bound to ingress. Status set to: RUNNING.`);
      onAddNotification('Container Scaled! ☁️', `Azure Container Apps successfully added a new instance of "${service}-service".`, 'system');
    }, 1500);
  };

  const terminatePod = (service: 'gateway' | 'python' | 'stripe', id: string) => {
    appendAcaLog(`Sending SIGTERM signature to pod ${id}. Commencing graceful drain.`);
    setPods(prev => ({
      ...prev,
      [service]: prev[service].map(p => p.id === id ? { ...p, status: 'Terminating', cpu: 0 } : p)
    }));

    setTimeout(() => {
      setPods(prev => ({
        ...prev,
        [service]: prev[service].filter(p => p.id !== id)
      }));
      appendAcaLog(`Pod ${id} completely removed from container environment.`);
    }, 1200);
  };

  // Auto-Scaling traffic simulation
  useEffect(() => {
    if (!autoscale) return;

    const interval = setInterval(() => {
      // Simulate random spikes and scaling
      const coin = Math.random();
      if (coin > 0.8) {
        // High traffic -> Scale Up Python service
        if (pods.python.length < 3) {
          scaleUp('python');
        }
      } else if (coin < 0.2) {
        // Low traffic -> scale down if more than 1
        if (pods.python.length > 1) {
          const runnings = pods.python.filter(p => p.status === 'Running');
          if (runnings.length > 0) {
            terminatePod('python', runnings[runnings.length - 1].id);
          }
        }
      }

      // Randomize CPU rates
      setPods(prev => {
        const updateCpus = (list: any[]) => list.map(p => p.status === 'Running' ? { ...p, cpu: Math.floor(Math.random() * 25) + 5 } : p);
        return {
          gateway: updateCpus(prev.gateway),
          python: updateCpus(prev.python),
          stripe: updateCpus(prev.stripe)
        };
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [autoscale, pods]);


  // ==========================================
  // TAB 2: Azure Cache for Redis States
  // ==========================================
  const [redisKeys, setRedisKeys] = useState<Record<string, { val: string; ttl: number }>>({
    'user:session:cyrus': { val: '{"id":"usr_093a","email":"cyrusw1606@gmail.com","role":"student"}', ttl: 1800 },
    'tutor:availability:cached': { val: '[{"id":"tutor_1","name":"Maya Lin","subjects":["SAT Math","Calculus"]},{"id":"tutor_2","name":"Dr. Aris"}]', ttl: 300 },
    'stripe:idempotency:session_99482': { val: '{"status":"initiated","invoice":"inv_88271"}', ttl: 60 },
    'python:ai:explain_calculus_easy': { val: '"Let u = x^2. Then du = 2x dx. Substitute to integrate!"', ttl: 600 }
  });
  const [redisInput, setRedisInput] = useState('');
  const [redisLogs, setRedisLogs] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'Connected to Azure Cache for Redis [Premium Clustered Instance].' },
    { type: 'output', text: 'Enter a Redis command (e.g., KEYS *, GET user:session:cyrus, SET test_key "Hello Redis", TTL test_key)' }
  ]);

  // Handle Redis live-TTL countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRedisKeys(prev => {
        const updated: Record<string, { val: string; ttl: number }> = {};
        let changed = false;
        const entries = Object.entries(prev) as [string, { val: string; ttl: number }][];
        for (const [key, item] of entries) {
          if (item.ttl > 1) {
            updated[key] = { ...item, ttl: item.ttl - 1 };
          } else {
            changed = true; // Key expired
          }
        }
        return changed || Object.keys(updated).length !== Object.keys(prev).length ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRedisCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redisInput.trim()) return;

    const command = redisInput.trim();
    setRedisLogs(prev => [...prev, { type: 'input', text: `redis-cli> ${command}` }]);
    setRedisInput('');

    const tokens = command.split(' ');
    const op = tokens[0].toUpperCase();

    if (op === 'PING') {
      setRedisLogs(prev => [...prev, { type: 'output', text: 'PONG' }]);
    } else if (op === 'KEYS') {
      const pattern = tokens[1] || '*';
      let keysToPrint = Object.keys(redisKeys);
      if (pattern !== '*') {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        keysToPrint = keysToPrint.filter(k => regex.test(k));
      }
      if (keysToPrint.length === 0) {
        setRedisLogs(prev => [...prev, { type: 'output', text: '(empty array)' }]);
      } else {
        keysToPrint.forEach((k, idx) => {
          setRedisLogs(prev => [...prev, { type: 'output', text: `${idx + 1}) "${k}"` }]);
        });
      }
    } else if (op === 'GET') {
      const key = tokens[1];
      if (!key) {
        setRedisLogs(prev => [...prev, { type: 'error', text: '(error) ERR wrong number of arguments for "get" command' }]);
      } else if (redisKeys[key]) {
        setRedisLogs(prev => [...prev, { type: 'output', text: `"${redisKeys[key].val}"` }]);
      } else {
        setRedisLogs(prev => [...prev, { type: 'output', text: '(nil)' }]);
      }
    } else if (op === 'SET') {
      const key = tokens[1];
      // Get all rest of the input as value
      const valStartIndex = command.indexOf(key) + key.length;
      let valueStr = command.substring(valStartIndex).trim();
      // Strip outer quotes if any
      if (valueStr.startsWith('"') && valueStr.endsWith('"')) valueStr = valueStr.slice(1, -1);
      if (valueStr.startsWith("'") && valueStr.endsWith("'")) valueStr = valueStr.slice(1, -1);

      if (!key || !valueStr) {
        setRedisLogs(prev => [...prev, { type: 'error', text: '(error) ERR wrong number of arguments for "set" command' }]);
      } else {
        setRedisKeys(prev => ({
          ...prev,
          [key]: { val: valueStr, ttl: 300 } // Default 5 mins TTL
        }));
        setRedisLogs(prev => [...prev, { type: 'output', text: 'OK' }]);
      }
    } else if (op === 'DEL') {
      const key = tokens[1];
      if (!key) {
        setRedisLogs(prev => [...prev, { type: 'error', text: '(error) ERR wrong number of arguments for "del" command' }]);
      } else if (redisKeys[key]) {
        setRedisKeys(prev => {
          const cpy = { ...prev };
          delete cpy[key];
          return cpy;
        });
        setRedisLogs(prev => [...prev, { type: 'output', text: '(integer) 1' }]);
      } else {
        setRedisLogs(prev => [...prev, { type: 'output', text: '(integer) 0' }]);
      }
    } else if (op === 'TTL') {
      const key = tokens[1];
      if (!key) {
        setRedisLogs(prev => [...prev, { type: 'error', text: '(error) ERR wrong number of arguments for "ttl" command' }]);
      } else if (redisKeys[key]) {
        setRedisLogs(prev => [...prev, { type: 'output', text: `(integer) ${redisKeys[key].ttl}` }]);
      } else {
        setRedisLogs(prev => [...prev, { type: 'output', text: '(integer) -2' }]); // Key does not exist
      }
    } else if (op === 'FLUSHALL') {
      setRedisKeys({});
      setRedisLogs(prev => [...prev, { type: 'output', text: 'OK (all keys flushed)' }]);
    } else {
      setRedisLogs(prev => [...prev, { type: 'error', text: `(error) ERR unknown command '${tokens[0]}'. Supported: PING, KEYS *, GET, SET, DEL, TTL, FLUSHALL` }]);
    }
  };


  // ==========================================
  // TAB 3: CI/CD Pipeline Simulator States
  // ==========================================
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [pipelineStep, setPipelineStep] = useState(0);
  const [cicdLogs, setCicdLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [cicdLogs]);

  const runPipeline = () => {
    setPipelineState('running');
    setPipelineStep(1);
    setCicdLogs([]);

    const steps = [
      { msg: '🚀 Initializing GitHub Actions Workflow: CI/CD Pipeline Build & Deploy', delay: 0 },
      { msg: '⚙️ Operating System Host: Ubuntu-latest Virtual Agent', delay: 400 },
      { msg: '📥 Step 1: Checking out branch "main" from private repository cyrusw1606/learning-collective...', delay: 800 },
      { msg: '✓ Checked out main successfully. Commit ID: 77daef3 [Add Stripe & Azure AD B2C portal]', delay: 1200 },
      { msg: '🔐 Step 2: Extracting Azure Service Principal Secret credentials...', delay: 1600 },
      { msg: '✓ Logged into Azure Resource Management portal successfully.', delay: 2000 },
      { msg: '🔒 Step 3: Logging into private Azure Container Registry: lc-acr.azurecr.io...', delay: 2400 },
      { msg: '✓ Credentials injected. Handshake accepted. Registry authorization token successfully set.', delay: 2800 },
      { msg: '🐳 Step 4: Compiling Docker multi-stage images for microservices...', delay: 3200 },
      { msg: '🐳 Building [1/3] service: "frontend-gateway" -> node:18-alpine base image...', delay: 3500 },
      { msg: '🐳 Building [2/3] service: "python-ai-service" -> python:3.11-slim base image...', delay: 4500 },
      { msg: '🐳 Building [3/3] service: "stripe-billing-service" -> node:18-alpine base image...', delay: 5500 },
      { msg: '✓ All Docker images successfully compiled locally.', delay: 6500 },
      { msg: '📤 Step 5: Tagging and pushing Docker images to ACR Repository...', delay: 7000 },
      { msg: '📤 Push -> lc-acr.azurecr.io/frontend:latest [OK - 144MB]', delay: 7400 },
      { msg: '📤 Push -> lc-acr.azurecr.io/python-ai:latest [OK - 310MB]', delay: 7800 },
      { msg: '📤 Push -> lc-acr.azurecr.io/stripe-billing:latest [OK - 150MB]', delay: 8200 },
      { msg: '✓ Images pushed. ACR Digest updated.', delay: 8600 },
      { msg: '☁️ Step 6: Updating Azure Container Apps Environment targets...', delay: 9000 },
      { msg: '☁️ Commencing rolling rollout upgrade on Environment: "lc-microservices-env"...', delay: 9400 },
      { msg: '☁️ Gateway service rolling: spin up 2 new pods -> drain 2 old pods...', delay: 9800 },
      { msg: '☁️ Python AI service rolling: spin up 1 new pod -> drain 1 old pod...', delay: 10400 },
      { msg: '☁️ Billing service rolling: spin up 1 new pod -> drain 1 old pod...', delay: 11000 },
      { msg: '✓ Azure Container Apps Environment healthcheck: 100% SUCCESS.', delay: 11500 },
      { msg: '🎉 PIPELINE RUN COMPLETED SUCCESSFULLY. Cloud deployment live!', delay: 12000 }
    ];

    steps.forEach((st) => {
      setTimeout(() => {
        setCicdLogs(prev => [...prev, st.msg]);
        if (st.msg.includes('Step 1')) setPipelineStep(1);
        else if (st.msg.includes('Step 3')) setPipelineStep(2);
        else if (st.msg.includes('Step 4')) setPipelineStep(3);
        else if (st.msg.includes('Step 5')) setPipelineStep(4);
        else if (st.msg.includes('Step 6')) setPipelineStep(5);
        else if (st.msg.includes('COMPLETED')) {
          setPipelineState('success');
          setPipelineStep(6);
          appendAcaLog('Microservices Environment updated via GitHub Actions CI/CD Pipeline. Loaded images tagged: latest.');
          onAddNotification('Pipeline Success! 🚀', 'GitHub Actions successfully updated your Azure Container Apps microservices!', 'system');
        }
      }, st.delay);
    });
  };


  // ==========================================
  // TAB 4: Azure AD B2C States
  // ==========================================
  const [b2cProvider, setB2cProvider] = useState<'google' | 'microsoft' | 'apple'>('google');
  const [b2cStep, setB2cStep] = useState<'idle' | 'redirecting' | 'authenticated'>('idle');
  const [b2cToken, setB2cToken] = useState('');

  const triggerB2cAuthSim = () => {
    setB2cStep('redirecting');
    setB2cToken('');
    setTimeout(() => {
      setB2cStep('authenticated');
      // Create standard JWT token mock
      const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'b2c_key_1' }));
      const payload = btoa(JSON.stringify({
        iss: 'https://learningcollectiveb2c.b2clogin.com/tfp/tenant_id/',
        sub: 'usr_093a8d9f1',
        name: currentUser?.fullName || 'Sarah Jenkins',
        email: currentUser?.email || 'cyrusw1606@gmail.com',
        role: currentUser?.role || 'student',
        idp: b2cProvider === 'google' ? 'google.com' : b2cProvider === 'microsoft' ? 'live.com' : 'apple.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      setB2cToken(`eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyY19rZXlfMSJ9.${payload}.[Signature_Bytes_Omit]`);
      
      onAddNotification(
        'B2C JWT Issued! 🔑', 
        `Azure AD B2C successfully completed handshake. Identity Provider used: ${b2cProvider.toUpperCase()}`, 
        'system'
      );
    }, 2000);
  };


  // ==========================================
  // TAB 5: Stripe elements & webhook states
  // ==========================================
  const [stripeProcessing, setStripeProcessing] = useState(false);
  const [stripeLogs, setStripeLogs] = useState<string[]>([]);
  const [stripeAmount, setStripeAmount] = useState('120');
  const [stripeSuccess, setStripeSuccess] = useState(false);

  const simulateStripePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStripeProcessing(true);
    setStripeLogs(prev => [...prev, `[STRIPE CLIENT] Creating PaymentIntent on endpoint /api/payments/create-intent for $${stripeAmount}.00`]);

    setTimeout(() => {
      setStripeLogs(prev => [
        ...prev,
        `[STRIPE SERVER] PaymentIntent initiated with status: requires_payment_method. Secret: pi_3M19a_secret_882`,
        `[STRIPE CLIENT] Rendering secure Stripe CardElement frame on page. Sending public key: pk_test_lc_882...`,
        `[STRIPE CLIENT] Sending secure payment credentials to stripe.com servers...`
      ]);

      setTimeout(() => {
        setStripeProcessing(false);
        setStripeSuccess(true);
        setStripeLogs(prev => [
          ...prev,
          `[STRIPE API] Webhook dispatch: payment_intent.succeeded (ID: pi_3M19a)`,
          `[STRIPE API] Webhook dispatch: charge.succeeded (ID: ch_3M19a)`,
          `[STRIPE SERVER] Webhook received & signature verified! Updating calendar database record...`
        ]);

        onAddNotification('Payment Confirmed! 💳', `Stripe Checkout completed successfully for the sum of $${stripeAmount}.00`, 'payment');
      }, 1500);

    }, 1500);
  };

  const resetStripeSim = () => {
    setStripeSuccess(false);
    setStripeLogs([]);
  };


  // ==========================================
  // TAB 6: Original Python Assistant Sandbox
  // ==========================================
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('python_api_url') || 'http://localhost:8000');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('python_api_key') || '');
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState('');
  const [explainTopic, setExplainTopic] = useState('Explain how u-substitution works in Calculus');
  const [explainLevel, setExplainLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [explainStatus, setExplainStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [explainResult, setExplainResult] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hi! I am your Python API assistant. When you run your Python server locally or in Azure, we will talk in real-time!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatStatus, setChatStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [pythonSubTab, setPythonSubTab] = useState<'tester' | 'explain' | 'chat'>('tester');

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

  const runConnectionTest = async () => {
    setTestStatus('testing');
    setTestResult('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const response = await fetch(`${apiUrl}/api/health`, { method: 'GET', headers });
      if (!response.ok) throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setTestStatus('success');
      setTestResult(JSON.stringify(data, null, 2));
      onAddNotification('Python API Connected! ✅', `Successfully connected to endpoint at ${apiUrl}/api/health`, 'system');
    } catch (err: any) {
      setTestStatus('error');
      setTestResult(err.message || 'Connection refused or CORS error.');
    }
  };

  const runExplainRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopic.trim()) return;
    setExplainStatus('loading');
    setExplainResult('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const response = await fetch(`${apiUrl}/api/explain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: explainTopic, level: explainLevel })
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setExplainStatus('success');
      setExplainResult(data.explanation || data.result || JSON.stringify(data, null, 2));
    } catch (err: any) {
      setExplainStatus('error');
      setExplainResult(`Failed to connect to ${apiUrl}/api/explain. Error: ${err.message}`);
    }
  };

  const runChatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, time: timestamp }]);
    setChatInput('');
    setChatStatus('sending');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text }))
        })
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      const botReply = data.response || data.reply || data.message || JSON.stringify(data);
      setChatHistory(prev => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setChatStatus('idle');
    } catch (err: any) {
      setChatStatus('error');
      setChatHistory(prev => [...prev, { sender: 'bot', text: `⚠️ Error communicating with ${apiUrl}/api/chat: ${err.message}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setChatStatus('idle');
    }
  };


  // ==========================================
  // Copyable code blocks templates
  // ==========================================
  const githubActionsYaml = `name: Build & Deploy to Azure Container Apps

on:
  push:
    branches: [ main ]

permissions:
  id-token: write
  contents: read

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # 1. Log in to Azure Container Registry (ACR)
      - name: Azure Container Registry Login
        uses: azure/docker-login@v1
        with:
          login-server: lc-acr.azurecr.io
          username: \${{ secrets.AZURE_ACR_USERNAME }}
          password: \${{ secrets.AZURE_ACR_PASSWORD }}

      # 2. Set up Buildx
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # 3. Build & Push Frontend Image
      - name: Build and Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: lc-acr.azurecr.io/frontend:latest

      # 4. Build & Push Python AI Service
      - name: Build and Push Python API
        uses: docker/build-push-action@v5
        with:
          context: ./services/python-ai
          push: true
          tags: lc-acr.azurecr.io/python-ai:latest

  deploy-to-azure:
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - name: Azure login via OIDC
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Update Container Apps Environment
        uses: azure/container-apps-deploy-action@v1
        with:
          acrName: lc-acr
          containerAppName: lc-frontend-app
          resourceGroup: lc-microservices-rg
          imageToDeploy: lc-acr.azurecr.io/frontend:latest`;

  const dockerfileMultiStage = `# Multi-Stage Dockerfile for Frontend Service
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Inject custom nginx config for SPA routing and HTTPS redirections
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]`;

  const redisConfigCode = `import redis
import json

# Setup Azure Cache for Redis instance client (Managed Secure Link)
redis_client = redis.StrictRedis(
    host="lc-redis.redis.cache.windows.net",
    port=6380,
    password="Azure_Redis_Primary_Access_Key_Here",
    ssl=True,
    decode_responses=True
)

def cache_session_token(token: str, user_payload: dict, ttl_seconds: int = 1800):
    """Stores authentication claims inside Redis cache layer to prevent redundant DB calls."""
    redis_client.set(f"user:session:{token}", json.dumps(user_payload), ex=ttl_seconds)

def get_session_token(token: str):
    """Retrieve auth credentials instantly in O(1) time complexity."""
    cached = redis_client.get(f"user:session:{token}")
    if cached:
        return json.loads(cached)
    return None`;

  const msalB2cConfig = `// Azure AD B2C Client-Side Configuration (React)
import { Configuration, PublicClientApplication } from "@azure/msal-browser";

export const b2cMsalConfig: Configuration = {
  auth: {
    clientId: "azure-ad-b2c-client-id-here", 
    authority: "https://learningcollectiveb2c.b2clogin.com/learningcollectiveb2c.onmicrosoft.com/B2C_1_signupsignin",
    knownAuthorities: ["learningcollectiveb2c.b2clogin.com"],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true, // Recommended for iframe environments and Safari
  }
};

export const msalInstance = new PublicClientApplication(b2cMsalConfig);`;

  const stripePaymentEndpoint = `// stripe-billing-service node.js Express API
const Express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = Express();

// 1. Endpoint for initiating Stripe Checkout Session securely
app.post('/api/payments/create-checkout', async (req, res) => {
  const { amount, sessionId, tutorName } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: \`Tutoring Lesson with \${tutorName}\`,
            description: \`Secure reservation checkout invoice: \${sessionId}\`
          },
          unit_amount: amount * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: \`https://learningcollective.edu/dashboard?payment=success&session=\${sessionId}\`,
      cancel_url: 'https://learningcollective.edu/calendar',
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Stripe Webhook Listener (Requires endpoint raw body parsing and signature validation)
app.post('/api/payments/webhook', Express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle successful card charge confirmation event
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    // Update booking status in database securely!
    console.log(\`💳 Payment Intent confirmed for \${charge.amount_captured / 100} USD!\`);
  }

  res.json({ received: true });
});`;


  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Dynamic Header Block */}
      <div className="bg-gradient-to-r from-stone-900 via-slate-800 to-stone-900 border border-slate-700 text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-bold text-sky-400">
            <Zap className="w-3.5 h-3.5 animate-pulse text-sky-400" />
            Azure Microservices Core Architecture
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-100 tracking-tight leading-tight">
            The Learning Collective Microservices Portal
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
            Monitor and test the full cloud infrastructure of the portal. Featuring secure multi-container hosting on Azure Container Apps, clustered Redis cache indexing, automated GitHub Actions pipelines, central Azure AD B2C OAuth identity federation, and Stripe payment Gateways.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0 relative z-10">
          <a 
            href="https://learn.microsoft.com/en-us/azure/container-apps/" 
            target="_blank" 
            rel="noreferrer" 
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-xl transition-all inline-flex items-center gap-1.5 shadow"
          >
            Azure Portal Docs <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Multi-Tab Ingress Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1.5 bg-white dark:bg-[#1a1e1b] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('aca')}
          className={`py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeTab === 'aca'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400 font-extrabold shadow-sm'
              : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Container Apps
        </button>

        <button
          onClick={() => setActiveTab('redis')}
          className={`py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeTab === 'redis'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 font-extrabold shadow-sm'
              : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Redis Cache
        </button>

        <button
          onClick={() => setActiveTab('cicd')}
          className={`py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeTab === 'cicd'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
              : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          CI/CD Pipeline
        </button>

        <button
          onClick={() => setActiveTab('b2c')}
          className={`py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeTab === 'b2c'
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-extrabold shadow-sm'
              : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Azure AD B2C
        </button>

        <button
          onClick={() => setActiveTab('python-ai')}
          className={`py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeTab === 'python-ai'
              ? 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400 font-extrabold shadow-sm'
              : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          Python AI Sandbox
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="bg-white dark:bg-[#1a1e1b] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl p-6 shadow-sm min-h-[550px] flex flex-col justify-between">
        
        {/* =======================================================
            TAB 1: AZURE CONTAINER APPS
           ======================================================= */}
        {activeTab === 'aca' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">Azure Container Apps Environment Visualizer</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Simulate live scaling, request processing, and health checks across microservices hosted inside Container Apps.
                </p>
              </div>

              {/* Autoscale toggle */}
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-xs font-bold text-neutral-600 dark:text-stone-300">KEDA Autoscale Simulator:</span>
                <button
                  onClick={() => setAutoscale(!autoscale)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoscale ? 'bg-sky-500' : 'bg-gray-350 dark:bg-stone-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoscale ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Microservices Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Node 1: frontend-gateway */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-sky-500 tracking-wider uppercase">Ingress Router</span>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-stone-200">frontend-gateway</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[9px] font-bold">PORT: 3000/443</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-neutral-500 dark:text-stone-400 font-bold">
                    <span>Active Pods:</span>
                    <span className="text-[#2D3A30] dark:text-stone-200">{pods.gateway.length} Instances</span>
                  </div>
                  <div className="space-y-1.5">
                    {pods.gateway.map(pod => (
                      <div key={pod.id} className="flex justify-between items-center p-2 bg-white dark:bg-stone-900/45 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px]">
                        <span className="font-mono text-neutral-600 dark:text-stone-300 font-bold">{pod.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">CPU: {pod.cpu}%</span>
                          <span className={`w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                          <button onClick={() => terminatePod('gateway', pod.id)} className="text-rose-500 hover:text-rose-700 hover:scale-110 cursor-pointer font-bold">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => scaleUp('gateway')}
                  className="w-full py-1.5 bg-white dark:bg-stone-900 text-neutral-800 dark:text-stone-200 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px] font-bold hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm"
                >
                  + Add Gateway Instance
                </button>
              </div>

              {/* Node 2: python-ai-service */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#8E613B] tracking-wider uppercase">Compute Engine</span>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-stone-200">python-ai-service</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-stone-250 text-neutral-800 text-[9px] font-bold">PORT: 8000</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-neutral-500 dark:text-stone-400 font-bold">
                    <span>Active Pods:</span>
                    <span className="text-[#2D3A30] dark:text-stone-200">{pods.python.length} Instances</span>
                  </div>
                  <div className="space-y-1.5">
                    {pods.python.map(pod => (
                      <div key={pod.id} className="flex justify-between items-center p-2 bg-white dark:bg-stone-900/45 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px]">
                        <span className="font-mono text-neutral-600 dark:text-stone-300 font-bold">{pod.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">CPU: {pod.cpu}%</span>
                          <span className={`w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                          {pods.python.length > 1 && (
                            <button onClick={() => terminatePod('python', pod.id)} className="text-rose-500 hover:text-rose-700 hover:scale-110 cursor-pointer font-bold">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => scaleUp('python')}
                  className="w-full py-1.5 bg-white dark:bg-stone-900 text-neutral-800 dark:text-stone-200 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px] font-bold hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm"
                >
                  + Scale Up AI Instances
                </button>
              </div>

              {/* Node 3: stripe-billing-service */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase">Transactions Manager</span>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-stone-200">stripe-billing-service</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">PORT: 4000</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-neutral-500 dark:text-stone-400 font-bold">
                    <span>Active Pods:</span>
                    <span className="text-[#2D3A30] dark:text-stone-200">{pods.stripe.length} Instances</span>
                  </div>
                  <div className="space-y-1.5">
                    {pods.stripe.map(pod => (
                      <div key={pod.id} className="flex justify-between items-center p-2 bg-white dark:bg-stone-900/45 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px]">
                        <span className="font-mono text-neutral-600 dark:text-stone-300 font-bold">{pod.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">CPU: {pod.cpu}%</span>
                          <span className={`w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                          {pods.stripe.length > 1 && (
                            <button onClick={() => terminatePod('stripe', pod.id)} className="text-rose-500 hover:text-rose-700 hover:scale-110 cursor-pointer font-bold">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => scaleUp('stripe')}
                  className="w-full py-1.5 bg-white dark:bg-stone-900 text-neutral-800 dark:text-stone-200 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px] font-bold hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm"
                >
                  + Add Billing Instance
                </button>
              </div>

            </div>

            {/* Docker configurations & code panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-500" />
                  Azure Container Apps Deployment Guide
                </h4>
                <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold">
                  Azure Container Apps is a serverless, Kubernetes-based container hosting service. You construct a Dockerfile for each microservice, push those images to Azure Container Registry (ACR), and declare the apps inside your Azure Resource Group. This manages inbound traffic SSL decryption, scales containers down to 0 automatically when traffic quietens, and handles service-to-service routing out-of-the-box.
                </p>
              </div>

              {/* Dockerfile Copy Card */}
              <div className="border border-slate-200 dark:border-stone-800 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden flex flex-col justify-between h-48">
                <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">Dockerfile (Frontend Service Stage build)</span>
                  <button
                    onClick={() => handleCopy(dockerfileMultiStage, 'docker')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'docker' ? 'Copied ✓' : 'Copy'}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <pre className="flex-1 p-3.5 overflow-auto text-[10px] text-slate-300 leading-relaxed select-all">
                  {dockerfileMultiStage}
                </pre>
              </div>
            </div>

            {/* Live Environment Logs Console */}
            <div className="border border-[#E6E2D3] dark:border-stone-800 rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-y-auto max-h-[160px] relative mt-4">
              <span className="absolute top-2 right-3 text-[9px] font-bold tracking-widest text-slate-500 uppercase">CONTAINER ENVIRONMENT LOGS</span>
              <div className="space-y-1">
                {acaLogs.map((log, idx) => (
                  <p key={idx} className="text-slate-300 leading-relaxed">{log}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: AZURE CACHE FOR REDIS
           ======================================================= */}
        {activeTab === 'redis' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">Azure Cache for Redis Simulator</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Directly interface with a secure fully-managed Microsoft Redis instance using the command line sandbox below.
                </p>
              </div>
              <div className="flex gap-2 text-xs font-bold text-rose-500">
                <span className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  REDIS ENGINE ONLINE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CLI terminal column */}
              <div className="lg:col-span-2 flex flex-col space-y-3">
                <div className="border border-slate-700 bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-200 h-64 overflow-y-auto flex flex-col space-y-1 relative shadow-inner">
                  <span className="absolute top-2 right-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">REDIS CLI SANDBOX</span>
                  {redisLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log.type === 'input' && <p className="text-sky-400 font-semibold">{log.text}</p>}
                      {log.type === 'output' && <p className="text-slate-300 whitespace-pre-wrap">{log.text}</p>}
                      {log.type === 'error' && <p className="text-rose-400 font-bold">{log.text}</p>}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleRedisCommand} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={redisInput}
                    onChange={(e) => setRedisInput(e.target.value)}
                    placeholder="e.g., SET user:session:temp 'test_value' or KEYS *"
                    className="flex-1 px-4 py-2.5 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-mono bg-white dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Send Command
                  </button>
                </form>
              </div>

              {/* Cache Store Key Monitor list */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-rose-500" />
                    Active Redis Store ({Object.keys(redisKeys).length} Keys)
                  </h4>
                  <div className="divide-y divide-[#E6E2D3] dark:divide-stone-800 max-h-48 overflow-y-auto space-y-2">
                    {Object.keys(redisKeys).length > 0 ? (
                      (Object.entries(redisKeys) as [string, { val: string; ttl: number }][]).map(([key, item]) => (
                        <div key={key} className="pt-2 text-[11px] leading-relaxed">
                          <div className="flex justify-between font-bold text-slate-700 dark:text-stone-200 font-mono">
                            <span className="truncate max-w-[150px]">{key}</span>
                            <span className="text-rose-500 text-[10px]">TTL: {item.ttl}s</span>
                          </div>
                          <p className="text-neutral-500 dark:text-stone-400 font-mono text-[10px] truncate max-w-full mt-0.5 bg-white dark:bg-stone-900 p-1 rounded border border-[#E6E2D3] dark:border-stone-800">
                            {item.val}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 italic text-center py-8">Redis store is completely empty.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRedisKeys({
                      'user:session:cyrus': { val: '{"id":"usr_093a","email":"cyrusw1606@gmail.com","role":"student"}', ttl: 1800 },
                      'tutor:availability:cached': { val: '[{"id":"tutor_1","name":"Maya Lin","subjects":["SAT Math","Calculus"]},{"id":"tutor_2","name":"Dr. Aris"}]', ttl: 300 },
                      'stripe:idempotency:session_99482': { val: '{"status":"initiated","invoice":"inv_88271"}', ttl: 60 }
                    });
                    setRedisLogs(prev => [...prev, { type: 'output', text: 'Seeded default cache keys.' }]);
                  }}
                  className="w-full py-2 bg-white dark:bg-stone-900 text-neutral-800 dark:text-stone-200 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[10px] font-bold hover:bg-[#FAF9F5] transition-all cursor-pointer shadow"
                >
                  Seed Default Cache Keys
                </button>
              </div>

            </div>

            {/* Redis integration info & code */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E6E2D3] dark:border-stone-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-500" />
                  Redis Cache in Microservices
                </h4>
                <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold">
                  In a distributed microservices ecosystem, keeping database queries cached prevents load spikes on Primary SQL or Firestore databases. Azure Cache for Redis provides an ultra-fast, managed, in-memory data store. We leverage Redis to:
                </p>
                <ul className="text-xs text-neutral-600 dark:text-stone-400 list-disc list-inside space-y-1 pl-1.5 font-semibold">
                  <li><strong>Central Session Store</strong>: Authenticate tokens once, index session claims into Redis, allowing stateless backend microservices to decrypt them in O(1) time.</li>
                  <li><strong>Idempotency Layers</strong>: Prevent duplicated charges by storing payment session states inside Redis with short TTL expiry limits.</li>
                  <li><strong>Schedule Indexing</strong>: Cache heavy tutor calendars and subject reviews.</li>
                </ul>
              </div>

              {/* Python Redis Cache example copy card */}
              <div className="border border-slate-200 dark:border-stone-800 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden flex flex-col justify-between h-48">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">redis_manager.py (Python Cache implementation)</span>
                  <button
                    onClick={() => handleCopy(redisConfigCode, 'redis_code')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'redis_code' ? 'Copied ✓' : 'Copy'}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <pre className="flex-1 p-3.5 overflow-auto text-[10px] text-slate-300 leading-relaxed select-all">
                  {redisConfigCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 3: CI/CD PIPELINE
           ======================================================= */}
        {activeTab === 'cicd' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">GitHub Actions CI/CD Run Simulator</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Observe and run a mock continuous integration workflow deploying docker images to Azure Container Registry and updating Azure Container Apps.
                </p>
              </div>

              <button
                onClick={runPipeline}
                disabled={pipelineState === 'running'}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {pipelineState === 'running' ? 'Pipeline Running...' : 'Push to Main & Deploy'}
                <Play className="w-3.5 h-3.5 fill-white" />
              </button>
            </div>

            {/* Pipeline Step Progress Visualizer */}
            <div className="grid grid-cols-6 gap-2 pt-2 text-center">
              {[
                { title: 'Checkout Repo', icon: Github },
                { title: 'Login ACR', icon: Shield },
                { title: 'Docker Build', icon: Cpu },
                { title: 'Push Images', icon: Send },
                { title: 'Deploy Apps', icon: Layers },
                { title: 'Cloud Active', icon: Sparkles }
              ].map((step, index) => {
                const stepNum = index + 1;
                const isActive = pipelineStep >= stepNum;
                const isCurrent = pipelineStep === stepNum && pipelineState === 'running';

                return (
                  <div key={index} className="space-y-2">
                    <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                        : 'bg-white dark:bg-stone-900 border-[#E6E2D3] dark:border-stone-800 text-[#9A9483]'
                    } ${isCurrent ? 'animate-bounce border-dashed' : ''}`}>
                      <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-spin' : ''}`} />
                    </div>
                    <p className={`text-[9px] font-bold tracking-tight ${isActive ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-[#9A9483]'}`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Terminal Pipeline Runner Log output */}
            <div 
              ref={scrollRef}
              className="border border-slate-700 bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-200 h-64 overflow-y-auto flex flex-col space-y-1 relative"
            >
              <span className="absolute top-2 right-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">GITHUB ACTIONS RUNNER</span>
              {cicdLogs.length > 0 ? (
                cicdLogs.map((log, idx) => {
                  let color = 'text-slate-300';
                  if (log.includes('SUCCESS') || log.includes('OK') || log.includes('✓')) color = 'text-emerald-400';
                  if (log.includes('🐳')) color = 'text-sky-400';
                  if (log.includes('🚀') || log.includes('Step')) color = 'text-yellow-400';
                  return <p key={idx} className={`${color} leading-relaxed font-semibold`}>{log}</p>;
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-bold">Runner Ready</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Click "Push to Main & Deploy" above to execute the pipeline run simulation and build your Docker containers.</p>
                </div>
              )}
            </div>

            {/* CI/CD config guide & YAML code copy block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E6E2D3] dark:border-stone-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-500" />
                  GitHub Actions & ACR CI/CD pipeline
                </h4>
                <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold">
                  By hosting your code in a private repository, you can automate build processes with GitHub Actions workflows. Upon pushes to the <code>main</code> branch:
                </p>
                <ul className="text-xs text-neutral-600 dark:text-stone-400 list-disc list-inside space-y-1 pl-1.5 font-semibold">
                  <li><strong>Workflow Trigger</strong>: Fires on pushes to main.</li>
                  <li><strong>Multi-Container Build</strong>: Compiles discrete Docker containers inside the Actions runner environment.</li>
                  <li><strong>Azure Container Registry (ACR)</strong>: Privately houses the built images, keeping credentials secret.</li>
                  <li><strong>Target Updates</strong>: Issues deployment requests to Azure Container Apps with zero-downtime rolling upgrades.</li>
                </ul>
              </div>

              {/* Pipeline Workflow YAML code block */}
              <div className="border border-slate-200 dark:border-stone-800 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden flex flex-col justify-between h-48">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">deploy-microservices.yml (GitHub Workflow)</span>
                  <button
                    onClick={() => handleCopy(githubActionsYaml, 'actions_code')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'actions_code' ? 'Copied ✓' : 'Copy'}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <pre className="flex-1 p-3.5 overflow-auto text-[10px] text-slate-300 leading-relaxed select-all">
                  {githubActionsYaml}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 4: AZURE AD B2C AUTHENTICATION
           ======================================================= */}
        {activeTab === 'b2c' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">Azure AD B2C Identity Provider Centralization</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Simulate external OAuth handshakes with Google, Microsoft, and Apple ID, fed through your Azure AD B2C identity tenant.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Interactive IDP configuration panel */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest">1. Select Identity Provider</h4>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'google', label: 'Google', icon: '🔴' },
                      { id: 'microsoft', label: 'Microsoft', icon: '🔵' },
                      { id: 'apple', label: 'Apple ID', icon: '⚫' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setB2cProvider(p.id as any); setB2cStep('idle'); }}
                        className={`p-3 border rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          b2cProvider === p.id 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white dark:bg-stone-900 border-[#E6E2D3] dark:border-stone-800 text-neutral-600 dark:text-stone-300 hover:border-[#5F7161]/50'
                        }`}
                      >
                        <span className="text-lg">{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-neutral-500 dark:text-stone-400 leading-relaxed font-semibold">
                    Federating logins simplifies multi-page authentication. Your microservices app only has to talk to the secure Azure AD B2C endpoints. B2C negotiates credentials with Google, Microsoft, and Apple, returning a structured cryptographically signed JWT.
                  </p>
                </div>

                <button
                  onClick={triggerB2cAuthSim}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer text-center"
                >
                  Initiate B2C Sign-In Redirect Flow
                </button>
              </div>

              {/* Handshake visual screen */}
              <div className="lg:col-span-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-5 bg-[#FAF9F5] dark:bg-stone-800/10 flex flex-col justify-between min-h-[250px]">
                
                {b2cStep === 'idle' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                    <UserCheck className="w-10 h-10 text-indigo-400 mb-2" />
                    <p className="text-xs font-bold">B2C Identity Session Idle</p>
                    <p className="text-[10px] text-neutral-500 mt-1 max-w-sm">Click "Initiate B2C Sign-In Redirect Flow" to simulate federating your login through your MS Microsoft tenant.</p>
                  </div>
                )}

                {b2cStep === 'redirecting' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Redirecting to Azure AD B2C Login Portal...</p>
                    <p className="text-[10px] text-neutral-500 mt-1 max-w-xs font-semibold">Resolving auth domain and handshaking credentials securely outside client browser state...</p>
                  </div>
                )}

                {b2cStep === 'authenticated' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-indigo-100 dark:border-stone-800 pb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        ✓ SECURE JWT ISSUED
                      </span>
                      <span className="text-[10px] font-bold text-[#9A9483]">IDP Identity: {b2cProvider.toUpperCase()}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Decoded ID Token (JSON Web Token Claims)</label>
                      <div className="p-3 bg-white dark:bg-stone-900 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-[10px] font-mono text-slate-700 dark:text-stone-200 space-y-1">
                        <p><span className="text-rose-500">"iss"</span>: "https://learningcollectiveb2c.b2clogin.com/tfp/..."</p>
                        <p><span className="text-rose-500">"sub"</span>: "usr_093a8d9f1"</p>
                        <p><span className="text-rose-500">"name"</span>: "{currentUser?.fullName || 'Sarah Jenkins'}"</p>
                        <p><span className="text-rose-500">"email"</span>: "{currentUser?.email || 'cyrusw1606@gmail.com'}"</p>
                        <p><span className="text-rose-500">"role"</span>: "{currentUser?.role || 'student'}"</p>
                        <p><span className="text-rose-500">"idp"</span>: "{b2cProvider === 'google' ? 'google.com' : b2cProvider === 'microsoft' ? 'live.com' : 'apple.com'}"</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Cryptographic Signature JWT String</label>
                      <input
                        type="text"
                        readOnly
                        value={b2cToken}
                        className="w-full px-2.5 py-1.5 bg-slate-900 text-slate-300 font-mono text-[9px] rounded border border-slate-700 outline-none select-all"
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* AD B2C integration guides & MSAL code copy cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E6E2D3] dark:border-stone-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Azure AD B2C setup specifications
                </h4>
                <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold">
                  Authentication in microservices is centralized via MSAL (Microsoft Authentication Library) client-side hooks, pointing back to the unified AD B2C domain tenant. Handshakes proceed as follows:
                </p>
                <ul className="text-xs text-neutral-600 dark:text-stone-400 list-disc list-inside space-y-1 pl-1.5 font-semibold">
                  <li><strong>Centralized Redirect</strong>: Client app redirects to Azure's customizable user flow portal (e.g. <code>B2C_1_signupsignin</code>).</li>
                  <li><strong>Federated Providers</strong>: Google, Microsoft, and Apple ID OAuth servers are configured inside Azure AD B2C Identity Providers settings, keeping local servers clear of API key dependencies.</li>
                  <li><strong>JWT Signatures</strong>: Upon verification, B2C issues a signed JWT Token containing claims.</li>
                </ul>
              </div>

              {/* MSAL configuration block */}
              <div className="border border-slate-200 dark:border-stone-800 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden flex flex-col justify-between h-48">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">msalConfig.ts (React MSAL.js Setup)</span>
                  <button
                    onClick={() => handleCopy(msalB2cConfig, 'msal_code')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'msal_code' ? 'Copied ✓' : 'Copy'}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <pre className="flex-1 p-3.5 overflow-auto text-[10px] text-slate-300 leading-relaxed select-all font-medium">
                  {msalB2cConfig}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 5: STRIPE CHECKOUT PORTAL
           ======================================================= */}
        {activeTab === 'stripe' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">Stripe Elements Payment Sandbox</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Test secure credit card transaction simulations using hosted Stripe checkout templates, verifying full PCI compliance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card checkout forms */}
              <div className="bg-[#FAF9F5] dark:bg-stone-800/10 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                
                {!stripeSuccess ? (
                  <form onSubmit={simulateStripePayment} className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      Stripe CardElement
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Checkout Amount ($ USD)</label>
                      <input
                        type="number"
                        required
                        disabled={stripeProcessing}
                        value={stripeAmount}
                        onChange={(e) => setStripeAmount(e.target.value)}
                        placeholder="120"
                        className="w-full px-3 py-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-semibold bg-white dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Mock Card Credentials</label>
                      <div className="p-3 bg-white dark:bg-stone-900 border border-[#E6E2D3] dark:border-stone-800 rounded-xl font-mono text-[10px] text-slate-600 dark:text-stone-300 space-y-1 leading-relaxed">
                        <p>Number: <span className="font-extrabold text-neutral-800 dark:text-stone-200">4242 •••• •••• 4242</span> (Stripe Test)</p>
                        <p>Expiry: <span className="font-extrabold">12 / 28</span> | CVC: <span className="font-extrabold">•••</span></p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={stripeProcessing}
                      className="w-full py-3 mt-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {stripeProcessing ? 'Creating Secure Intent...' : `Complete Stripe Elements Pay`}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#2D3A30] dark:text-stone-100">Simulated Charge Succeeded!</h4>
                      <p className="text-[10px] text-neutral-500 dark:text-stone-400">Payment completed successfully on standard stripe servers.</p>
                    </div>
                    <button
                      onClick={resetStripeSim}
                      className="px-4 py-2 bg-white dark:bg-stone-900 text-neutral-800 dark:text-stone-200 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-bold hover:bg-[#FAF9F5] cursor-pointer shadow-sm"
                    >
                      Process Another Charge
                    </button>
                  </div>
                )}

              </div>

              {/* Transactions Webhook logs */}
              <div className="lg:col-span-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-5 bg-[#FAF9F5] dark:bg-stone-800/10 flex flex-col justify-between min-h-[250px]">
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest border-b border-[#E6E2D3] dark:border-stone-800 pb-2">
                    Stripe Server-Side Webhook Event Stream
                  </h4>
                  
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-300 h-44 overflow-y-auto space-y-1 shadow-inner">
                    {stripeLogs.length > 0 ? (
                      stripeLogs.map((log, idx) => {
                        let color = 'text-slate-300';
                        if (log.includes('Webhook received') || log.includes('Webhook dispatch')) color = 'text-emerald-400';
                        if (log.includes('Creating PaymentIntent') || log.includes('requires_payment_method')) color = 'text-yellow-400 font-semibold';
                        return <p key={idx} className={`${color} leading-relaxed`}>{log}</p>;
                      })
                    ) : (
                      <p className="text-slate-500 italic py-12 text-center">No payment actions logged yet. Authorize a transaction to start processing stream.</p>
                    )}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed font-semibold mt-4">
                  🔒 <strong>PCI Compliance Mandates:</strong> Credit card numbers never land on our local databases. The secure Stripe CardElement proxies raw credentials directly to Stripe. The backend server merely listens for signed asynchronous Webhook events to update session booking database indices.
                </div>
              </div>

            </div>

            {/* Code implementation of checkout creation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E6E2D3] dark:border-stone-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-500" />
                  Stripe SDK Payment architecture
                </h4>
                <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold">
                  We leverage the Stripe SDK inside our <code>stripe-billing-service</code> container. Payments proceed as follows:
                </p>
                <ul className="text-xs text-neutral-600 dark:text-stone-400 list-disc list-inside space-y-1 pl-1.5 font-semibold">
                  <li><strong>Intents Setup</strong>: Server endpoints generate a PaymentIntent, supplying a <code>client_secret</code> token to the React frontend.</li>
                  <li><strong>Card Element rendering</strong>: React utilizes <code>CardElement</code>, isolating credential inputs from local React state.</li>
                  <li><strong>Webhook Signatures</strong>: Node backends listen for transaction signals, validating incoming cryptographic headers.</li>
                </ul>
              </div>

              {/* Express Node stripe code block */}
              <div className="border border-slate-200 dark:border-stone-800 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-hidden flex flex-col justify-between h-48">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">checkout_router.js (Node Express Billing Engine)</span>
                  <button
                    onClick={() => handleCopy(stripePaymentEndpoint, 'stripe_code')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'stripe_code' ? 'Copied ✓' : 'Copy'}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <pre className="flex-1 p-3.5 overflow-auto text-[10px] text-slate-300 leading-relaxed select-all">
                  {stripePaymentEndpoint}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 6: ORIGINAL PYTHON AI SANDBOX (PRESERVED ENDPOINTS)
           ======================================================= */}
        {activeTab === 'python-ai' && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-stone-200">Python FastAPI & Flask AI Sandbox</h3>
                <p className="text-xs text-neutral-500 dark:text-stone-400 font-medium mt-0.5">
                  Secure local or Azure-hosted Python computational sandbox to test homework explanations and student chat systems.
                </p>
              </div>
              
              {/* Settings button */}
              <div className="flex gap-1.5 bg-slate-100 dark:bg-stone-800 p-1 border border-slate-200 dark:border-stone-700 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setPythonSubTab('tester')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    pythonSubTab === 'tester' ? 'bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-100 shadow-sm' : 'text-[#9A9483] hover:text-[#2D3A30]'
                  }`}
                >
                  Handshake
                </button>
                <button
                  onClick={() => setPythonSubTab('explain')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    pythonSubTab === 'explain' ? 'bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-100 shadow-sm' : 'text-[#9A9483] hover:text-[#2D3A30]'
                  }`}
                >
                  Explain
                </button>
                <button
                  onClick={() => setPythonSubTab('chat')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    pythonSubTab === 'chat' ? 'bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-100 shadow-sm' : 'text-[#9A9483] hover:text-[#2D3A30]'
                  }`}
                >
                  Buddy Chat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: API URLs */}
              <div className="bg-white dark:bg-[#1a1e1b] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
                <div className="flex items-center gap-2 border-b border-[#E6E2D3] dark:border-stone-800 pb-2">
                  <Settings className="w-4 h-4 text-[#5F7161]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-stone-200">Connection Settings</h4>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Python API Base URL</label>
                    <input
                      type="url"
                      required
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="e.g., http://localhost:8000"
                      className="w-full px-3 py-2.5 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-mono font-semibold bg-[#FDFCF8] dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Auth Token (Optional)</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="API authorization bearer key"
                      className="w-full px-3 py-2.5 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-mono font-semibold bg-[#FDFCF8] dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-xs rounded-xl border border-[#5F7161] cursor-pointer shadow-sm text-center"
                  >
                    {isSaved ? 'Settings Saved ✓' : 'Save Connection'}
                  </button>
                </form>
              </div>

              {/* Right Column: Run selected helper */}
              <div className="lg:col-span-2 border border-[#E6E2D3] dark:border-stone-800 bg-[#FAF9F5] dark:bg-stone-800/10 rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
                
                {pythonSubTab === 'tester' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-neutral-800 dark:text-stone-200">Handshake Handler (GET /api/health)</h4>
                      <p className="text-xs text-neutral-500 dark:text-stone-400 mt-1">Check endpoints for network limits, TLS validity, and CORS config.</p>
                    </div>

                    <button
                      onClick={runConnectionTest}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 bg-[#2D3A30] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      {testStatus === 'testing' ? 'Testing Handshake...' : 'Run Handshake Test'}
                    </button>

                    <div className="border border-[#E6E2D3] dark:border-stone-800 rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] h-36 overflow-auto">
                      {testStatus === 'idle' && <p className="text-slate-400 italic">Ready for handshake test...</p>}
                      {testStatus === 'testing' && <p className="text-yellow-400">⚡ GET {apiUrl}/api/health...</p>}
                      {testStatus === 'success' && <pre className="text-emerald-400 font-semibold">{testResult}</pre>}
                      {testStatus === 'error' && <p className="text-rose-400 font-bold">{testResult}</p>}
                    </div>
                  </div>
                )}

                {pythonSubTab === 'explain' && (
                  <form onSubmit={runExplainRequest} className="space-y-4">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-neutral-800 dark:text-stone-200">Homework Helper (POST /api/explain)</h4>
                      <p className="text-xs text-neutral-500 dark:text-stone-400 mt-1">Fetch subject reviews directly from Python REST models.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={explainTopic}
                        onChange={(e) => setExplainTopic(e.target.value)}
                        placeholder="Explain mitosis vs meiosis"
                        className="col-span-2 px-3 py-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs bg-white dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200"
                      />
                      <select
                        value={explainLevel}
                        onChange={(e: any) => setExplainLevel(e.target.value)}
                        className="px-3 py-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs bg-white dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <button
                        type="submit"
                        disabled={explainStatus === 'loading'}
                        className="px-4 py-2 bg-[#5F7161] text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        {explainStatus === 'loading' ? 'Analyzing...' : 'Analyze'}
                      </button>
                    </div>

                    <div className="border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-stone-900 p-3 rounded-xl text-xs text-neutral-700 dark:text-stone-200 max-h-32 overflow-auto whitespace-pre-wrap font-semibold">
                      {explainStatus === 'idle' && <p className="text-neutral-400 italic">Submit topic analysis payload.</p>}
                      {explainStatus === 'loading' && <p className="text-neutral-400 italic">Interfacing with API...</p>}
                      {explainStatus === 'success' && explainResult}
                      {explainStatus === 'error' && <p className="text-rose-500 font-bold">{explainResult}</p>}
                    </div>
                  </form>
                )}

                {pythonSubTab === 'chat' && (
                  <div className="space-y-3">
                    <div className="border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-stone-900 p-3 rounded-xl h-44 overflow-y-auto space-y-2 flex flex-col shadow-inner">
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`max-w-[85%] text-xs font-semibold p-2 rounded-xl leading-relaxed ${chat.sender === 'user' ? 'bg-[#5F7161] text-white self-end' : 'bg-stone-100 dark:bg-stone-800 text-neutral-800 dark:text-stone-200 self-start'}`}>
                          {chat.text}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={runChatRequest} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask your Python server any question..."
                        className="flex-1 px-3 py-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs bg-white dark:bg-stone-900 text-[#3D3D3D] dark:text-stone-200 focus:outline-none"
                      />
                      <button type="submit" className="p-2 bg-[#5F7161] text-white rounded-xl shadow-sm">Send</button>
                    </form>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
