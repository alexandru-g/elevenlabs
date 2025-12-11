import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  MapPin,
  AlertCircle,
  Activity,
  User,
  Volume2,
  VolumeX,
  Radio,
  PhoneOff,
  Ambulance,
  Shield,
  Flame,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Message,
  ProtocolTracker,
  ProgressBar,
  LiveWaveform,
  EssentialQuestions,
  ESSENTIAL_QUESTIONS,
  detectQuestionStatus,
  detectAnswerReceived,
} from '../components';
import type { EssentialQuestion } from '../components';
import { useAudioRecorder, useElevenLabs } from '../hooks';
import type { TrainingScenario, ConversationMessage, ProtocolStepUI } from '../types';

interface TrainingCallProps {
  scenario: TrainingScenario;
  onEndCall: (sessionData: SessionData) => void;
}

interface SessionData {
  duration: number;
  messages: ConversationMessage[];
  protocolSteps: ProtocolStepUI[];
  overallScore: number;
  responseTimeAvg: number;
  empathyScore: number;
  protocolScore: number;
}

interface ExtendedScenario extends TrainingScenario {
  voice_id?: string;
  voice_stability?: number;
  voice_similarity_boost?: number;
  voice_style?: number;
}

const DEFAULT_PROTOCOL_STEPS = [
  'Identify emergency type',
  'Get exact location',
  'Assess injuries',
  'Dispatch appropriate units',
  'Provide caller instructions',
  'Maintain calm demeanor',
];

function generateCallerResponse(
  scenario: TrainingScenario,
  messageIndex: number,
  operatorMessage?: string
): string {
  void scenario.dialogue_patterns;
  const responses: Record<string, string[]> = {
    'Car Accident - Highway Collision': [
      "Oh my god, please help! There's been a terrible accident. I can't find my phone... no wait, I have it. We're on the highway!",
      "I think near exit 47? There's so much smoke and my passenger isn't moving! Please hurry!",
      "I don't know! I'm scared to move. There's glass everywhere and the other car is completely smashed.",
      "Yes, yes I can see them breathing now. But they're unconscious. There's blood on their forehead. Please, how long until help arrives?",
      "Okay, okay I'm trying to stay calm. I can hear sirens now. Are those for us? Please tell them to hurry!",
    ],
    'Medical Emergency - Cardiac Arrest': [
      "Hello? I need help. My chest hurts so bad. I can't breathe properly.",
      "I'm at 4523 Oak Street. Apartment 2B. The door should be unlocked.",
      "I take blood pressure medicine. And something for my heart. I can't remember the names right now.",
      "It started maybe 20 minutes ago. Getting worse. My arm is tingling. Please, I'm alone here.",
      "Yes, I'll try to stay on the line. Getting hard to stay awake.",
    ],
    'Home Intrusion - Active Threat': [
      "Please help me. Someone broke into my house. I'm hiding in my closet upstairs.",
      "I heard glass break downstairs. There's at least one person, maybe two. I heard voices.",
      "1847 Maple Drive. Master bedroom closet. Please, I think they're coming upstairs.",
      "No weapons that I know of. Please send someone quickly. My phone battery is at 12%.",
      "They're in my room. I have to be quiet.",
    ],
    'Fire Emergency - Apartment Building': [
      "Hello?! There's a fire in my building! I can't get out, the hallway is full of smoke!",
      "I'm at 892 Pine Avenue, third floor, apartment 304. The alarm's been going off for five minutes!",
      "I can hear people screaming in the hallway. My neighbor, she's elderly. I don't know if she got out!",
      "I closed the door and put towels under it like they say. The smoke is still getting in though.",
      "I'm at my window now. I can see the street. Please, how much longer? It's getting really hot in here.",
    ],
    'Emergency Childbirth': [
      "Oh god, please help us! My wife is having the baby right now! We can't make it to the hospital!",
      "We're at 567 Birch Lane. The contractions are like 30 seconds apart now!",
      "She's 38 weeks! The doctor said it would be another week but... Honey, breathe!",
      "I can see the head! What do I do?! I don't know what to do!",
      "Okay, okay, I'm listening. Towels and blankets ready. She says she needs to push!",
    ],
    'Drug Overdose - Unresponsive Friend': [
      "Oh god, please help! My roommate won't wake up. I think... I think he took something at the party. He's barely breathing!",
      "We're in Westfield Dorm, room 312 on the third floor. His name is Marcus, he's 22.",
      "I don't know exactly what he took. There was stuff at the party... pills maybe? His lips are turning blue!",
      "There's a Narcan kit in the RA's office down the hall. Should I get it? I don't want to leave him!",
      "Okay, I tilted his head back like you said. He's still breathing but it's really slow and shallow.",
      "I think it's working! He's starting to move a little. Oh thank god. Is he going to be okay?",
    ],
  };

  const scenarioResponses = responses[scenario.title] || responses['Car Accident - Highway Collision'];

  if (operatorMessage) {
    const lowerMessage = operatorMessage.toLowerCase();
    if (messageIndex === 0) {
      return scenarioResponses[0];
    }
    if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address')) {
      return scenarioResponses[1];
    }
    if (lowerMessage.includes('injur') || lowerMessage.includes('hurt') || lowerMessage.includes('breathing')) {
      return scenarioResponses[3];
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('way') || lowerMessage.includes('dispatch')) {
      return scenarioResponses[4];
    }
  }

  return scenarioResponses[Math.min(messageIndex, scenarioResponses.length - 1)];
}

export function TrainingCall({ scenario, onEndCall }: TrainingCallProps) {
  const extendedScenario = scenario as ExtendedScenario;

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStepUI[]>(() =>
    DEFAULT_PROTOCOL_STEPS.map((name, i) => ({
      id: `step-${i}`,
      name,
      completed: false,
      order: i,
    }))
  );
  const [inputValue, setInputValue] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stressLevel, setStressLevel] = useState(80);
  const [locationConfidence, setLocationConfidence] = useState(0);
  const [dispatchedServices, setDispatchedServices] = useState<Set<string>>(new Set());
  const [isCallerSpeaking, setIsCallerSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [essentialQuestions, setEssentialQuestions] = useState<EssentialQuestion[]>(() =>
    ESSENTIAL_QUESTIONS.map((q) => ({ ...q, status: 'pending' as const }))
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseTimesRef = useRef<number[]>([]);
  const lastOperatorTimeRef = useRef<number>(0);
  const messageIndexRef = useRef(0);
  const pendingResponseRef = useRef<string>('');

  const { speak, isSpeaking, stopSpeaking, isConfigured } = useElevenLabs();
  const [micError, setMicError] = useState<string | null>(null);

  const {
    isRecording,
    audioLevel,
    startRecording,
    stopRecording,
    hasPermission,
    requestPermission,
    error: recorderError,
  } = useAudioRecorder({
    onStop: async (blob) => {
      if (blob.size > 0) {
        setIsProcessing(true);
        setMicError(null);
        try {
          const text = await transcribeAudio(blob);
          if (text.trim()) {
            setInputValue(text);
          } else {
            setMicError('No speech detected. Try speaking louder or check your microphone.');
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Transcription failed';
          setMicError(errorMsg);
          console.error('Transcription error:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    },
  });

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const mimeType = blob.type || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

    const formData = new FormData();
    formData.append('audio', blob, `recording.${extension}`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('STT Error Response:', result);
      if (result.error?.includes('API key')) {
        throw new Error('ElevenLabs API key not configured. Contact admin.');
      }
      if (result.details) {
        throw new Error(`STT Error: ${result.details}`);
      }
      throw new Error(result.error || result.message || 'Speech recognition failed');
    }

    return result.text || '';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkProtocolCompletion = useCallback((message: string, isCallerMessage = false) => {
    const lowerMessage = message.toLowerCase();

    setProtocolSteps((steps) =>
      steps.map((step) => {
        if (step.completed) return step;

        const operatorTriggers: Record<string, string[]> = {
          'Identify emergency type': [
            'what', 'happen', 'emergency', 'situation', 'tell me', 'describe', 'going on',
            'type of', 'kind of', 'nature of', '911', 'help you'
          ],
          'Get exact location': [
            'where', 'location', 'address', 'street', 'city', 'apartment', 'building',
            'intersection', 'highway', 'exit', 'floor', 'room', 'near'
          ],
          'Assess injuries': [
            'hurt', 'injur', 'pain', 'bleed', 'breath', 'conscious', 'awake', 'responsive',
            'moving', 'pulse', 'heart', 'chest', 'head', 'wound', 'broken', 'okay', 'alright'
          ],
          'Dispatch appropriate units': [
            'sending', 'dispatch', 'on the way', 'units', 'help is', 'ambulance', 'paramedic',
            'fire', 'police', 'officer', 'responder'
          ],
          'Provide caller instructions': [
            'stay', 'keep', 'don\'t', 'do not', 'try to', 'need you to', 'important', 'make sure',
            'listen', 'follow', 'instruction', 'step', 'first', 'next', 'now', 'can you'
          ],
          'Maintain calm demeanor': [
            'okay', 'understand', 'i\'m here', 'with you', 'calm', 'breathe', 'help',
            'going to be', 'it\'s okay', 'alright', 'i understand', 'doing great'
          ],
        };

        const callerTriggers: Record<string, string[]> = {
          'Identify emergency type': [
            'accident', 'fire', 'crash', 'break in', 'intruder', 'chest pain', 'heart',
            'overdose', 'baby', 'birth', 'bleeding', 'shot', 'stabbed', 'can\'t breathe'
          ],
          'Get exact location': [
            'street', 'avenue', 'drive', 'road', 'apartment', 'floor', 'exit', 'highway',
            'building', 'room', 'dorm'
          ],
          'Assess injuries': [
            'hurt', 'bleeding', 'unconscious', 'not moving', 'breathing', 'pulse', 'pain',
            'broken', 'blue', 'unresponsive'
          ],
        };

        const triggers = isCallerMessage ? callerTriggers : operatorTriggers;
        const stepTriggers = triggers[step.name] || [];

        if (stepTriggers.some((trigger) => lowerMessage.includes(trigger))) {
          return { ...step, completed: true, completedAt: elapsedTime };
        }
        return step;
      })
    );

    if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address')) {
      setLocationConfidence((c) => Math.min(100, c + 35));
    }
  }, [elapsedTime]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const initialMessage = generateCallerResponse(scenario, 0);
      const message: ConversationMessage = {
        id: `msg-${Date.now()}`,
        speaker: 'caller',
        message: initialMessage,
        timestamp: 0,
        emotion: 'panicked',
      };
      setMessages([message]);
      setIsCallerSpeaking(true);
      messageIndexRef.current = 1;

      checkProtocolCompletion(initialMessage, true);

      if (audioEnabled && isConfigured) {
        try {
          await speak(initialMessage, {
            voiceId: extendedScenario.voice_id,
            stability: extendedScenario.voice_stability,
            similarityBoost: extendedScenario.voice_similarity_boost,
            style: extendedScenario.voice_style,
          });
        } catch {
          console.log('TTS not available');
        }
      }
      setIsCallerSpeaking(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [scenario, audioEnabled, isConfigured, speak, extendedScenario, checkProtocolCompletion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    const responseTime = elapsedTime - lastOperatorTimeRef.current;
    if (lastOperatorTimeRef.current > 0) {
      responseTimesRef.current.push(responseTime);
    }
    lastOperatorTimeRef.current = elapsedTime;

    const operatorMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      speaker: 'operator',
      message: messageText,
      timestamp: elapsedTime,
    };
    setMessages((m) => [...m, operatorMessage]);
    checkProtocolCompletion(messageText);
    setInputValue('');

    setEssentialQuestions((prev) => detectQuestionStatus(messageText, prev));

    pendingResponseRef.current = messageText;

    setTimeout(async () => {
      setIsCallerSpeaking(true);

      const callerText = generateCallerResponse(scenario, messageIndexRef.current, pendingResponseRef.current);

      setTimeout(async () => {
        const callerResponse: ConversationMessage = {
          id: `msg-${Date.now()}`,
          speaker: 'caller',
          message: callerText,
          timestamp: elapsedTime + 3,
          emotion: stressLevel > 60 ? 'panicked' : 'anxious',
        };
        setMessages((m) => [...m, callerResponse]);
        messageIndexRef.current += 1;
        setStressLevel((s) => Math.max(30, s - 5));

        checkProtocolCompletion(callerText, true);
        setEssentialQuestions((prev) => detectAnswerReceived(callerText, prev));

        if (audioEnabled && isConfigured) {
          try {
            await speak(callerText, {
              voiceId: extendedScenario.voice_id,
              stability: extendedScenario.voice_stability,
              similarityBoost: extendedScenario.voice_similarity_boost,
              style: extendedScenario.voice_style,
            });
          } catch {
            console.log('TTS not available');
          }
        }
        setIsCallerSpeaking(false);
      }, 500);
    }, 500);
  }, [inputValue, elapsedTime, checkProtocolCompletion, scenario, stressLevel, audioEnabled, isConfigured, speak, extendedScenario]);

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (hasPermission === false) {
        await requestPermission();
      }
      await startRecording();
    }
  };

  const handleDispatch = (type: 'ambulance' | 'police' | 'fire') => {
    if (dispatchedServices.has(type)) return;

    setDispatchedServices((prev) => new Set([...prev, type]));
    setProtocolSteps((steps) =>
      steps.map((step) =>
        step.name === 'Dispatch appropriate units'
          ? { ...step, completed: true, completedAt: elapsedTime }
          : step
      )
    );
  };

  const handleEndCall = () => {
    stopSpeaking();
    if (isRecording) {
      stopRecording();
    }

    const completedSteps = protocolSteps.filter((s) => s.completed).length;
    const protocolScore = Math.round((completedSteps / protocolSteps.length) * 100);
    const avgResponseTime =
      responseTimesRef.current.length > 0
        ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
        : 15;
    const empathyScore = Math.min(100, Math.round(85 + (100 - stressLevel) * 0.15));
    const overallScore = Math.round((protocolScore * 0.4 + empathyScore * 0.3 + Math.max(0, 100 - avgResponseTime * 3) * 0.3));

    onEndCall({
      duration: elapsedTime,
      messages,
      protocolSteps,
      overallScore,
      responseTimeAvg: avgResponseTime,
      empathyScore,
      protocolScore,
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-56 bg-bg-secondary border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="card-elevated p-3 text-center">
            <div className="text-2xl mb-1">{scenario.icon}</div>
            <p className="text-sm font-medium text-text-primary">{scenario.persona_name}</p>
            <p className="text-xs text-text-tertiary font-mono">{formatTime(elapsedTime)}</p>

            {(isCallerSpeaking || isSpeaking) && (
              <div className="mt-2 flex items-center justify-center">
                <LiveWaveform
                  audioLevel={isSpeaking ? 60 : 40}
                  isActive={isCallerSpeaking || isSpeaking}
                  color="#F4A259"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-tertiary">Audio</p>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-1 rounded transition-colors ${
                audioEnabled ? 'bg-status-success/20 text-status-success' : 'bg-bg-hover text-text-tertiary'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-accent-blue" />
            <span className="text-xs text-text-secondary">
              {isSpeaking ? 'Speaking' : isCallerSpeaking ? 'Processing' : 'Ready'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 border-b border-white/5">
          <EssentialQuestions
            questions={essentialQuestions}
            onSelectPrompt={(prompt) => setInputValue(prompt)}
            compact
          />
        </div>

        <div className="p-3">
          <button
            onClick={handleEndCall}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-red text-white rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-white/5 bg-bg-secondary/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl">{scenario.icon}</div>
              <div>
                <h2 className="text-sm font-medium text-text-primary">{scenario.title}</h2>
                <p className="text-xs text-text-secondary">AI Voice Caller</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-status-warning" />
                <span className={`badge text-xs ${locationConfidence >= 65 ? 'badge-success' : 'badge-warning'}`}>
                  {locationConfidence >= 65 ? 'Located' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ambulance className="w-3 h-3 text-accent-blue" />
                <span className={`badge text-xs ${dispatchedServices.size > 0 ? 'badge-success' : 'badge-warning'}`}>
                  {dispatchedServices.size > 0 ? `${dispatchedServices.size} Sent` : 'None'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-accent-red" />
                <div className="w-16">
                  <ProgressBar
                    value={stressLevel}
                    variant={stressLevel > 70 ? 'critical' : stressLevel > 40 ? 'warning' : 'success'}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <Message
              key={msg.id}
              message={msg}
              isLatest={i === messages.length - 1}
              showWaveform={isCallerSpeaking && msg.speaker === 'caller' && i === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-white/5 bg-bg-secondary/50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleMicToggle}
              disabled={isProcessing || isSpeaking}
              className={`p-2 rounded transition-all ${
                isRecording
                  ? 'bg-accent-red text-white animate-pulse'
                  : isProcessing
                  ? 'bg-bg-tertiary text-text-tertiary'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {isRecording && (
              <div className="flex items-center gap-2 px-2 py-1 bg-accent-red/10 rounded">
                <LiveWaveform audioLevel={audioLevel} isActive={isRecording} color="#E76F51" />
                <span className="text-xs text-accent-red">Recording...</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 px-2 py-1 bg-accent-cyan/10 rounded">
                <Loader2 className="w-3 h-3 animate-spin text-accent-cyan" />
                <span className="text-xs text-accent-cyan">Transcribing...</span>
              </div>
            )}

            {(micError || recorderError) && !isRecording && !isProcessing && (
              <div className="flex items-center gap-1 px-2 py-1 bg-accent-amber/10 rounded max-w-[200px]">
                <AlertCircle className="w-3 h-3 text-accent-amber flex-shrink-0" />
                <span className="text-xs text-accent-amber truncate">{micError || recorderError}</span>
              </div>
            )}

            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isRecording ? 'Recording...' : 'Type response or use mic...'}
                className="input-field text-sm py-2"
                disabled={isRecording || isProcessing}
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isProcessing || isRecording}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDispatch('ambulance')}
              disabled={dispatchedServices.has('ambulance')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                dispatchedServices.has('ambulance')
                  ? 'bg-status-success/20 text-status-success cursor-default'
                  : 'bg-status-critical/20 text-status-critical hover:bg-status-critical/30'
              }`}
            >
              <Ambulance className="w-3 h-3" />
              {dispatchedServices.has('ambulance') ? 'Sent' : 'Ambulance'}
            </button>
            <button
              onClick={() => handleDispatch('police')}
              disabled={dispatchedServices.has('police')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                dispatchedServices.has('police')
                  ? 'bg-status-success/20 text-status-success cursor-default'
                  : 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30'
              }`}
            >
              <Shield className="w-3 h-3" />
              {dispatchedServices.has('police') ? 'Sent' : 'Police'}
            </button>
            <button
              onClick={() => handleDispatch('fire')}
              disabled={dispatchedServices.has('fire')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                dispatchedServices.has('fire')
                  ? 'bg-status-success/20 text-status-success cursor-default'
                  : 'bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/30'
              }`}
            >
              <Flame className="w-3 h-3" />
              {dispatchedServices.has('fire') ? 'Sent' : 'Fire'}
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1.5 bg-accent-red/20 text-accent-red rounded hover:bg-accent-red/30 transition-colors text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Critical
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 bg-bg-secondary border-l border-white/5 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-accent-blue" />
            <h3 className="text-xs font-medium text-text-primary">Scenario</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{scenario.situation}</p>
        </div>

        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-accent-amber" />
            <h3 className="text-xs font-medium text-text-primary">Caller: {scenario.persona_name}</h3>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
            <span>Age: {scenario.persona_age}</span>
            <span>Voice: {scenario.persona_voice}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 border-b border-white/5">
          <ProtocolTracker steps={protocolSteps} currentTime={elapsedTime} />
        </div>

        <div className="p-3 border-b border-white/5">
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
            Key Info
          </h4>
          <div className="space-y-1">
            {scenario.key_info.slice(0, 3).map((info, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-text-secondary"
              >
                <div className="w-1 h-1 rounded-full bg-accent-cyan" />
                <span className="truncate">{info}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">Audio</span>
            <span className={audioEnabled ? 'text-status-success' : 'text-text-tertiary'}>
              {audioEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-text-tertiary">Avg Response</span>
            <span className="text-text-primary">
              {responseTimesRef.current.length > 0
                ? `${(responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length).toFixed(1)}s`
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
