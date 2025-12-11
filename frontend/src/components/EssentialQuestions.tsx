import { MapPin, AlertCircle, Heart, Users, AlertTriangle, Phone, Check, Clock, HelpCircle } from 'lucide-react';

export interface EssentialQuestion {
  id: string;
  label: string;
  shortLabel: string;
  prompt: string;
  icon: typeof MapPin;
  status: 'pending' | 'asked' | 'answered';
  keywords: string[];
}

export const ESSENTIAL_QUESTIONS: Omit<EssentialQuestion, 'status'>[] = [
  {
    id: 'location',
    label: 'Location',
    shortLabel: 'Location',
    prompt: "Can you tell me your exact location? Where are you right now?",
    icon: MapPin,
    keywords: ['location', 'where', 'address', 'street', 'highway', 'exit', 'floor', 'building', 'landmark', 'intersection'],
  },
  {
    id: 'nature',
    label: 'Nature of Emergency',
    shortLabel: 'Emergency Type',
    prompt: "What is happening right now? What is the emergency?",
    icon: AlertCircle,
    keywords: ['what happened', 'what is happening', 'what\'s happening', 'emergency', 'situation', 'going on', 'tell me what', 'describe'],
  },
  {
    id: 'injuries',
    label: 'Injuries / Condition',
    shortLabel: 'Injuries',
    prompt: "Is anyone injured or unconscious? Is everyone breathing?",
    icon: Heart,
    keywords: ['injured', 'hurt', 'bleeding', 'unconscious', 'breathing', 'conscious', 'awake', 'responsive', 'pulse', 'alive'],
  },
  {
    id: 'people',
    label: 'Number of People',
    shortLabel: 'People Involved',
    prompt: "How many people are involved or affected?",
    icon: Users,
    keywords: ['how many', 'number of', 'people', 'persons', 'victims', 'passengers', 'anyone else', 'others', 'alone'],
  },
  {
    id: 'danger',
    label: 'Immediate Danger',
    shortLabel: 'Danger Status',
    prompt: "Are you or anyone else in immediate danger right now?",
    icon: AlertTriangle,
    keywords: ['danger', 'safe', 'threat', 'weapon', 'fire', 'spreading', 'collapse', 'intruder', 'armed', 'attacking'],
  },
  {
    id: 'identity',
    label: 'Identity & Callback',
    shortLabel: 'Caller ID',
    prompt: "What is your name and what number are you calling from?",
    icon: Phone,
    keywords: ['name', 'your name', 'call you', 'callback', 'phone number', 'reach you', 'contact', 'disconnected'],
  },
];

interface EssentialQuestionsProps {
  questions: EssentialQuestion[];
  onSelectPrompt: (prompt: string) => void;
  compact?: boolean;
}

export function EssentialQuestions({ questions, onSelectPrompt, compact = false }: EssentialQuestionsProps) {
  const answeredCount = questions.filter(q => q.status === 'answered').length;
  const askedCount = questions.filter(q => q.status === 'asked').length;
  const progress = ((answeredCount + askedCount * 0.5) / questions.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Essential Questions
        </h4>
        <span className="text-xs text-text-tertiary">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-cyan to-status-success rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {questions.map((question) => {
          const Icon = question.icon;
          const statusConfig = {
            pending: {
              bg: 'bg-bg-tertiary/50 hover:bg-bg-hover',
              border: 'border-transparent',
              iconBg: 'bg-bg-hover',
              iconColor: 'text-text-tertiary',
              textColor: 'text-text-secondary',
              badge: null,
            },
            asked: {
              bg: 'bg-accent-amber/10',
              border: 'border-accent-amber/30',
              iconBg: 'bg-accent-amber/20',
              iconColor: 'text-accent-amber',
              textColor: 'text-text-primary',
              badge: <Clock className="w-3 h-3 text-accent-amber" />,
            },
            answered: {
              bg: 'bg-status-success/10',
              border: 'border-status-success/30',
              iconBg: 'bg-status-success/20',
              iconColor: 'text-status-success',
              textColor: 'text-text-primary',
              badge: <Check className="w-3 h-3 text-status-success" />,
            },
          }[question.status];

          return (
            <button
              key={question.id}
              onClick={() => question.status === 'pending' && onSelectPrompt(question.prompt)}
              disabled={question.status !== 'pending'}
              className={`w-full flex items-center gap-2 p-2 rounded border transition-all text-left ${statusConfig.bg} ${statusConfig.border} ${
                question.status === 'pending' ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className={`p-1.5 rounded ${statusConfig.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${statusConfig.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${statusConfig.textColor}`}>
                  {compact ? question.shortLabel : question.label}
                </p>
                {!compact && question.status === 'pending' && (
                  <p className="text-xs text-text-tertiary truncate mt-0.5">
                    Click to ask
                  </p>
                )}
              </div>
              {statusConfig.badge && (
                <div className="flex-shrink-0">
                  {statusConfig.badge}
                </div>
              )}
              {question.status === 'pending' && (
                <HelpCircle className="w-3 h-3 text-text-tertiary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {answeredCount < questions.length && (
        <p className="text-xs text-text-tertiary italic">
          Click a pending question to use as prompt
        </p>
      )}
    </div>
  );
}

export function detectQuestionStatus(
  message: string,
  questions: EssentialQuestion[]
): EssentialQuestion[] {
  const lowerMessage = message.toLowerCase();

  return questions.map((question) => {
    if (question.status === 'answered') return question;

    const isAsking = question.keywords.some((keyword) => lowerMessage.includes(keyword));

    if (isAsking) {
      return {
        ...question,
        status: question.status === 'pending' ? 'asked' : question.status,
      };
    }

    return question;
  });
}

export function detectAnswerReceived(
  callerMessage: string,
  questions: EssentialQuestion[]
): EssentialQuestion[] {
  const lowerMessage = callerMessage.toLowerCase();

  return questions.map((question) => {
    if (question.status !== 'asked') return question;

    const answerIndicators: Record<string, string[]> = {
      location: ['street', 'avenue', 'road', 'highway', 'exit', 'floor', 'apartment', 'building', 'near', 'at the', 'i\'m at', 'we\'re at', 'address'],
      nature: ['accident', 'fire', 'someone', 'help', 'emergency', 'broke', 'attack', 'hurt', 'sick', 'chest', 'breathing', 'baby'],
      injuries: ['yes', 'no', 'breathing', 'not moving', 'unconscious', 'bleeding', 'hurt', 'injured', 'alive', 'conscious', 'awake'],
      people: ['one', 'two', 'three', 'four', 'five', 'just me', 'alone', 'people', 'passenger', 'passengers', 'victims', 'us', 'myself'],
      danger: ['safe', 'danger', 'fire', 'weapon', 'gun', 'knife', 'spreading', 'close', 'coming', 'attacking', 'no danger', 'yes', 'no'],
      identity: ['my name', 'i\'m', 'i am', 'this is', 'number', 'call me', 'reach me', 'calling from'],
    };

    const indicators = answerIndicators[question.id] || [];
    const hasAnswer = indicators.some((indicator) => lowerMessage.includes(indicator));

    if (hasAnswer) {
      return { ...question, status: 'answered' as const };
    }

    return question;
  });
}
