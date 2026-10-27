import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Send,
  Volume2,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  User,
  MessageSquare,
  Shield,
  Layers,
  Copy,
  Check,
  Hand,
  Sliders,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  FastForward,
} from 'lucide-react';
import { SIGN_LANGUAGES, SPOKEN_LANGUAGES } from '../data/languages';
import { ConversationMessage } from '../types/conversation';
import { cameraService } from '../services/cameraService';
import { speechService } from '../services/speechService';
import { translationService } from '../services/translationService';
import { ConversationAvatarPresenter } from '../components/conversation/ConversationAvatarPresenter';

interface PendingInput {
  senderRole: 'signer' | 'speaker';
  originalText: string;
  modality: 'text' | 'voice' | 'camera';
  customTranslation?: string;
  startedAt: number;
  translatedText?: string;
  glossText?: string;
  engine?: string;
  confidence?: number;
  isReady?: boolean;
}

export const ConversationPage: React.FC = () => {
  // Languages for the two participants
  const [signerLangId, setSignerLangId] = useState('isl');
  const [speakerLangId, setSpeakerLangId] = useState('ml');

  // Active sender selection ('signer' or 'speaker')
  const [activeSenderRole, setActiveSenderRole] = useState<'signer' | 'speaker'>('signer');

  // Input Modality: 'text' | 'voice' | 'camera'
  const [inputModality, setInputModality] = useState<'text' | 'voice' | 'camera'>('camera');

  // Output Channels active
  const [outputChannels, setOutputChannels] = useState<{
    text: boolean;
    voice: boolean;
    avatar: boolean;
  }>({
    text: true,
    voice: true,
    avatar: true,
  });

  // 5-Second Delay & Auto-Turn Switch Settings
  const [enableDelaySwitch, setEnableDelaySwitch] = useState(true);
  const [isTranslatingDelay, setIsTranslatingDelay] = useState(false);
  const [delayCountdown, setDelayCountdown] = useState(5.0);
  const [pendingInputData, setPendingInputData] = useState<PendingInput | null>(null);
  const [turnSwitchNotice, setTurnSwitchNotice] = useState<string | null>(null);

  // Conversation messages state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // Text inputs
  const [textInput, setTextInput] = useState('');

  // Voice recognition states
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechInterim, setSpeechInterim] = useState('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [showMesh, setShowMesh] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [useDemoSignFeed, setUseDemoSignFeed] = useState(false);

  // Avatar presenter state
  const [activePresentingMessage, setActivePresentingMessage] = useState<ConversationMessage | null>(null);
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
  const [avatarSpeed, setAvatarSpeed] = useState(1.0);
  const [autoPresent, setAutoPresent] = useState(true);

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  const currentSignLang = SIGN_LANGUAGES.find((s) => s.id === signerLangId) || SIGN_LANGUAGES[0];
  const currentSpokenLang = SPOKEN_LANGUAGES.find((s) => s.id === speakerLangId) || SPOKEN_LANGUAGES[1];

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTranslatingDelay]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cameraService.stopCamera();
      speechService.stop();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Synchronize camera video stream with video DOM element reliably
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isCameraActive && activeStream) {
        cameraService.attachStreamToVideo(video, activeStream);
      } else if (!isCameraActive) {
        video.srcObject = null;
      }
    }
  }, [activeStream, isCameraActive, useDemoSignFeed, inputModality]);

  // Experimental Hand landmark drawing on camera canvas
  useEffect(() => {
    let animId: number;
    const drawLandmarks = () => {
      if (showMesh && isCameraActive && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const w = (video && video.videoWidth > 0) ? video.videoWidth : 640;
        const h = (video && video.videoHeight > 0) ? video.videoHeight : 360;

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const time = Date.now() / 600;

          // Chest signing zone guide
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(w * 0.22, h * 0.25, w * 0.56, h * 0.65);
          ctx.setLineDash([]);

          // Skeleton points
          const leftHandX = w * 0.35 + Math.sin(time) * 18;
          const leftHandY = h * 0.6 + Math.cos(time * 1.5) * 20;
          const rightHandX = w * 0.65 + Math.cos(time * 1.2) * 18;
          const rightHandY = h * 0.6 + Math.sin(time * 1.3) * 20;

          ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.3);
          ctx.lineTo(w * 0.35, h * 0.4);
          ctx.lineTo(leftHandX, leftHandY);
          ctx.moveTo(w * 0.5, h * 0.3);
          ctx.lineTo(w * 0.65, h * 0.4);
          ctx.lineTo(rightHandX, rightHandY);
          ctx.stroke();

          // Hand points
          [
            { x: leftHandX, y: leftHandY },
            { x: rightHandX, y: rightHandY },
          ].forEach((pt) => {
            ctx.fillStyle = '#22D3EE';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      }
      animId = requestAnimationFrame(drawLandmarks);
    };

    if (showMesh && isCameraActive) {
      animId = requestAnimationFrame(drawLandmarks);
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    return () => cancelAnimationFrame(animId);
  }, [showMesh, isCameraActive]);

  // Handle Camera toggling
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      cameraService.stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
      setActiveStream(null);
      setIsCameraActive(false);
      setUseDemoSignFeed(false);
      setCameraError(null);
    } else {
      setCameraError(null);
      try {
        const stream = await cameraService.startCamera({ facingMode: cameraFacing });
        setActiveStream(stream);
        setIsCameraActive(true);
        setUseDemoSignFeed(false);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, stream);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message);
        // Seamless fallback to virtual sign feed so user can test visual tracking
        const virtualStream = cameraService.createVirtualSignStream();
        setActiveStream(virtualStream);
        setUseDemoSignFeed(true);
        setIsCameraActive(true);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, virtualStream);
        }
      }
    }
  };

  const handleSwitchFeedMode = async (toVirtual: boolean) => {
    setCameraError(null);
    setUseDemoSignFeed(toVirtual);
    if (toVirtual) {
      const virtualStream = cameraService.createVirtualSignStream();
      setActiveStream(virtualStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        await cameraService.attachStreamToVideo(videoRef.current, virtualStream);
      }
    } else {
      try {
        const stream = await cameraService.startCamera({ facingMode: cameraFacing });
        setActiveStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, stream);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message);
        setUseDemoSignFeed(true);
      }
    }
  };

  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (isCameraActive && !useDemoSignFeed) {
      try {
        const stream = await cameraService.startCamera({ facingMode: nextFacing });
        setActiveStream(stream);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, stream);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message);
      }
    }
  };

  // Handle Voice / Mic dictation
  const handleToggleMic = () => {
    if (isListeningMic) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListeningMic(false);
    } else {
      setSpeechError(null);
      setSpeechInterim('');
      if (!speechService.isRecognitionSupported()) {
        setSpeechError('Speech recognition is not supported in this browser. Please use the Text input tab.');
        return;
      }

      // Determine recognition language: signer or speaker
      const langCode = activeSenderRole === 'signer' ? 'en-US' : currentSpokenLang.bcp47;

      const rec = speechService.createRecognizer(
        langCode,
        (transcript, isFinal) => {
          setSpeechInterim(transcript);
          if (isFinal) {
            handleInitiateMessage(transcript, 'voice');
            setSpeechInterim('');
            setIsListeningMic(false);
          }
        },
        (err) => {
          setSpeechError(`Microphone recognition issue: ${err}`);
          setIsListeningMic(false);
        },
        () => {
          setIsListeningMic(false);
        }
      );

      if (rec) {
        recognizerRef.current = rec;
        try {
          rec.start();
          setIsListeningMic(true);
        } catch (e: unknown) {
          const error = e as Error;
          setSpeechError(error.message);
        }
      }
    }
  };

  // Commit and deliver the translated message, trigger outputs, and switch turns
  // Commit and deliver the translated message, trigger outputs, and switch turns
  const commitFinalMessage = (
    cleanText: string,
    modality: 'text' | 'voice' | 'camera',
    precomputedTranslation: string | undefined,
    senderRole: 'signer' | 'speaker',
    engine?: string,
    glossText?: string
  ) => {
    const isSigner = senderRole === 'signer';
    const translated = precomputedTranslation || cleanText;

    const newMessage: ConversationMessage = {
      id: `conv-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: isSigner ? 'p-signer' : 'p-speaker',
      senderRole: senderRole,
      senderName: isSigner
        ? `Signing Participant (${currentSignLang.code})`
        : `Speaking Participant (${currentSpokenLang.name})`,
      originalText: cleanText,
      translatedText: translated,
      sourceLanguageId: isSigner ? signerLangId : speakerLangId,
      targetLanguageId: isSigner ? speakerLangId : signerLangId,
      timestamp: Date.now(),
      provenance: 'live',
      inputModality: modality,
      audioAvailable: true,
      engine: engine || 'Live Neural MT Engine',
      glossText: glossText,
    };

    setMessages((prev) => [...prev, newMessage]);

    // 1. Voice Output: speak translated text if Voice output enabled
    if (outputChannels.voice) {
      if (isSigner) {
        // Speak in target spoken language
        speechService.speak(translated.replace(/^\[.*?\]:\s*/, ''), currentSpokenLang.bcp47);
      } else {
        // Speaker spoke: audio confirmation
        speechService.speak(cleanText, currentSpokenLang.bcp47);
      }
    }

    // 2. AI Avatar Output: present message if Avatar output enabled and autoPresent is on
    if (outputChannels.avatar && autoPresent) {
      setActivePresentingMessage(newMessage);
      setIsAvatarPlaying(true);
    }

    // AUTOMATIC LANGUAGE & TURN SWITCHING:
    // Switch active communicator to the other person and their corresponding language
    const nextRole: 'signer' | 'speaker' = isSigner ? 'speaker' : 'signer';
    setActiveSenderRole(nextRole);

    // Contextually switch the default input modality for the new participant:
    // If switching to Signer, prefer Camera (if camera was started) or Text
    // If switching to Speaker, prefer Voice or Text
    if (nextRole === 'signer') {
      setInputModality(isCameraActive ? 'camera' : 'text');
    } else {
      setInputModality('voice');
    }

    const nextLangLabel = nextRole === 'signer' ? `${currentSignLang.name} (${currentSignLang.code})` : `${currentSpokenLang.name} (${currentSpokenLang.nativeName})`;
    setTurnSwitchNotice(`Turn switched to ${nextRole === 'signer' ? 'Participant A (Signer)' : 'Participant B (Speaker)'} · ${nextLangLabel}`);
    setTimeout(() => setTurnSwitchNotice(null), 4000);
  };

  // Main input entrypoint: initiates real translation and 5-second countdown if enabled
  const handleInitiateMessage = (
    textToSend: string,
    modality: 'text' | 'voice' | 'camera',
    customTranslation?: string
  ) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isTranslatingDelay) return;

    if (!enableDelaySwitch) {
      // Instant path: translate with real engine and commit
      translationService.translateConversationTurn({
        text: cleanText,
        senderRole: activeSenderRole,
        sourceLangId: activeSenderRole === 'signer' ? signerLangId : speakerLangId,
        targetLangId: activeSenderRole === 'signer' ? speakerLangId : signerLangId,
      }).then((res) => {
        commitFinalMessage(
          cleanText,
          modality,
          res.translatedText,
          activeSenderRole,
          res.engine,
          res.glossText
        );
      }).catch(() => {
        commitFinalMessage(cleanText, modality, customTranslation, activeSenderRole);
      });
      return;
    }

    // 5-second translation delay path
    setPendingInputData({
      senderRole: activeSenderRole,
      originalText: cleanText,
      modality,
      customTranslation,
      startedAt: Date.now(),
      isReady: false,
    });
    setDelayCountdown(5.0);
    setIsTranslatingDelay(true);
    setTextInput('');

    // Launch real neural translation asynchronously during the countdown
    translationService.translateConversationTurn({
      text: cleanText,
      senderRole: activeSenderRole,
      sourceLangId: activeSenderRole === 'signer' ? signerLangId : speakerLangId,
      targetLangId: activeSenderRole === 'signer' ? speakerLangId : signerLangId,
    }).then((res) => {
      setPendingInputData((prev) => {
        if (!prev || prev.originalText !== cleanText) return prev;
        return {
          ...prev,
          translatedText: res.translatedText,
          glossText: res.glossText,
          engine: res.engine,
          confidence: res.confidence,
          isReady: true,
        };
      });
    }).catch((err) => {
      console.warn('Real translation error:', err);
    });
  };

  // Skip delay countdown immediately and reveal translation
  const handleSkipDelay = () => {
    if (pendingInputData) {
      const dataToCommit = pendingInputData;
      setPendingInputData(null);
      setIsTranslatingDelay(false);
      if (dataToCommit.translatedText) {
        commitFinalMessage(
          dataToCommit.originalText,
          dataToCommit.modality,
          dataToCommit.translatedText,
          dataToCommit.senderRole,
          dataToCommit.engine,
          dataToCommit.glossText
        );
      } else {
        translationService.translateConversationTurn({
          text: dataToCommit.originalText,
          senderRole: dataToCommit.senderRole,
          sourceLangId: dataToCommit.senderRole === 'signer' ? signerLangId : speakerLangId,
          targetLangId: dataToCommit.senderRole === 'signer' ? speakerLangId : signerLangId,
        }).then((res) => {
          commitFinalMessage(
            dataToCommit.originalText,
            dataToCommit.modality,
            res.translatedText,
            dataToCommit.senderRole,
            res.engine,
            res.glossText
          );
        }).catch(() => {
          commitFinalMessage(
            dataToCommit.originalText,
            dataToCommit.modality,
            dataToCommit.customTranslation,
            dataToCommit.senderRole
          );
        });
      }
    }
  };

  // 5-Second Delay Timer Hook
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTranslatingDelay && pendingInputData) {
      const startTime = Date.now();
      const totalDurationMs = 5000;

      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (totalDurationMs - elapsed) / 1000);
        setDelayCountdown(remaining);

        if (elapsed >= totalDurationMs) {
          clearInterval(timer);
          setIsTranslatingDelay(false);
          const dataToCommit = pendingInputData;
          setPendingInputData(null);
          if (dataToCommit.translatedText) {
            commitFinalMessage(
              dataToCommit.originalText,
              dataToCommit.modality,
              dataToCommit.translatedText,
              dataToCommit.senderRole,
              dataToCommit.engine,
              dataToCommit.glossText
            );
          } else {
            translationService.translateConversationTurn({
              text: dataToCommit.originalText,
              senderRole: dataToCommit.senderRole,
              sourceLangId: dataToCommit.senderRole === 'signer' ? signerLangId : speakerLangId,
              targetLangId: dataToCommit.senderRole === 'signer' ? speakerLangId : signerLangId,
            }).then((res) => {
              commitFinalMessage(
                dataToCommit.originalText,
                dataToCommit.modality,
                res.translatedText,
                dataToCommit.senderRole,
                res.engine,
                res.glossText
              );
            }).catch(() => {
              commitFinalMessage(
                dataToCommit.originalText,
                dataToCommit.modality,
                dataToCommit.customTranslation,
                dataToCommit.senderRole
              );
            });
          }
        }
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isTranslatingDelay, pendingInputData, signerLangId, speakerLangId, outputChannels, autoPresent, isCameraActive]);

  // Quick Sign Gestures for Camera Input
  const quickSignGestures = [
    {
      sign: 'I need assistance / help',
      gestureLabel: 'Need Help',
    },
    {
      sign: 'Hello / Namaste',
      gestureLabel: 'Greetings',
    },
    {
      sign: 'Thank you very much',
      gestureLabel: 'Thank You',
    },
    {
      sign: 'Where is the nearest hospital or clinic?',
      gestureLabel: 'Where Clinic?',
    },
    {
      sign: 'Could you please repeat that once more?',
      gestureLabel: 'Repeat Please',
    },
    {
      sign: 'Yes, I understand completely',
      gestureLabel: 'Yes / Understood',
    },
  ];

  const handleTriggerQuickSign = (gesture: typeof quickSignGestures[0]) => {
    handleInitiateMessage(gesture.sign, 'camera');
  };

  // Play audio for a specific message
  const handlePlayVoice = (msg: ConversationMessage) => {
    const isSigner = msg.senderRole === 'signer';
    const textToSpeak = isSigner
      ? msg.translatedText.replace(/^\[.*?\]:\s*/, '')
      : msg.originalText;
    speechService.speak(textToSpeak, currentSpokenLang.bcp47);
  };

  // Focus AI Avatar on a specific message
  const handlePresentWithAvatar = (msg: ConversationMessage) => {
    setActivePresentingMessage(msg);
    setIsAvatarPlaying(true);
  };

  const handleCopyMessage = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Load sample dialogue
  const handleLoadDemoConversation = () => {
    const demoMsgs: ConversationMessage[] = [
      {
        id: 'msg-demo-1',
        senderId: 'p-signer',
        senderRole: 'signer',
        senderName: `Signing Participant (${currentSignLang.code})`,
        originalText: 'Hello! I am glad to communicate with you.',
        translatedText: 'ഹലോ! നിങ്ങളുമായി ആശയവിനിമയം നടത്തുന്നതിൽ എനിക്ക് സന്തോഷമുണ്ട്.',
        sourceLanguageId: signerLangId,
        targetLanguageId: speakerLangId,
        timestamp: Date.now() - 1000 * 60 * 3,
        provenance: 'demo',
        inputModality: 'camera',
        audioAvailable: true,
      },
      {
        id: 'msg-demo-2',
        senderId: 'p-speaker',
        senderRole: 'speaker',
        senderName: `Speaking Participant (${currentSpokenLang.name})`,
        originalText: 'നമസ്കാരം! ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
        translatedText: 'Greetings! How may I assist you today?',
        sourceLanguageId: speakerLangId,
        targetLanguageId: signerLangId,
        timestamp: Date.now() - 1000 * 60 * 2,
        provenance: 'demo',
        inputModality: 'voice',
        audioAvailable: true,
      },
      {
        id: 'msg-demo-3',
        senderId: 'p-signer',
        senderRole: 'signer',
        senderName: `Signing Participant (${currentSignLang.code})`,
        originalText: 'Where is the digital registration desk located?',
        translatedText: 'ഡിജിറ്റൽ രജിസ്ട്രേഷൻ ഡെസ്ക് എവിടെയാണ് സ്ഥിതി ചെയ്യുന്നത്?',
        sourceLanguageId: signerLangId,
        targetLanguageId: speakerLangId,
        timestamp: Date.now() - 1000 * 60 * 1,
        provenance: 'demo',
        inputModality: 'camera',
        audioAvailable: true,
      },
      {
        id: 'msg-demo-4',
        senderId: 'p-speaker',
        senderRole: 'speaker',
        senderName: `Speaking Participant (${currentSpokenLang.name})`,
        originalText: 'രണ്ടാം നിലയിൽ, ലിഫ്റ്റിന്റെ വലതുവശത്താണ് രജിസ്ട്രേഷൻ ഡെസ്ക്.',
        translatedText: 'On the second floor, right next to the elevators.',
        sourceLanguageId: speakerLangId,
        targetLanguageId: signerLangId,
        timestamp: Date.now() - 1000 * 20,
        provenance: 'demo',
        inputModality: 'text',
        audioAvailable: true,
      },
    ];

    setMessages(demoMsgs);
    setActivePresentingMessage(demoMsgs[demoMsgs.length - 1]);
    if (outputChannels.avatar) {
      setIsAvatarPlaying(true);
    }
  };

  const handleClearTranscript = () => {
    if (confirm('Clear the current conversation transcript?')) {
      setMessages([]);
      setActivePresentingMessage(null);
      setIsAvatarPlaying(false);
      setIsTranslatingDelay(false);
      setPendingInputData(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 lg:p-8 space-y-5 max-w-[1560px] mx-auto w-full">
      {/* Page Title & Top Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Bidirectional Conversation
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
              5s Translation Delay · Auto-Turn Switch
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            Person gives input → 5s neural synthesis delay → output delivered (Text, Voice, Avatar) → automatically switches language and turn to the other person.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleLoadDemoConversation}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-semibold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Dialogue</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearTranscript}
              className="p-2 rounded-xl bg-[#121A2B] hover:bg-[#182338] border border-white/10 text-slate-400 hover:text-rose-400 transition"
              title="Clear transcript"
              aria-label="Clear transcript"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Participants & Output Channels Configuration Card */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Languages Selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Participant A Sign Language */}
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-wider block">
              Participant A (Sign Language)
            </label>
            <select
              value={signerLangId}
              onChange={(e) => setSignerLangId(e.target.value)}
              className="w-full py-1.5 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              {SIGN_LANGUAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.region}
                </option>
              ))}
            </select>
          </div>

          {/* Participant B Spoken Language */}
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-wider block">
              Participant B (Spoken Language)
            </label>
            <select
              value={speakerLangId}
              onChange={(e) => setSpeakerLangId(e.target.value)}
              className="w-full py-1.5 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#22D3EE]"
            >
              {SPOKEN_LANGUAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nativeName}) - {s.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5s Delay & Output Channels Settings */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0B1020] p-1.5 rounded-xl border border-white/5 self-stretch lg:self-center shrink-0">
          {/* 5-Second Delay & Auto-Switch Toggle */}
          <button
            type="button"
            onClick={() => setEnableDelaySwitch(!enableDelaySwitch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              enableDelaySwitch
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 5-second translation delay and automatic language/turn switching"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>5s Delay & Switch: {enableDelaySwitch ? 'ON' : 'OFF'}</span>
          </button>

          <span className="text-white/10 hidden sm:inline">|</span>

          {/* Text Output Toggle */}
          <button
            type="button"
            onClick={() => setOutputChannels((p) => ({ ...p, text: !p.text }))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              outputChannels.text
                ? 'bg-[#182338] text-white border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Text</span>
          </button>

          {/* Voice Output Toggle */}
          <button
            type="button"
            onClick={() => setOutputChannels((p) => ({ ...p, voice: !p.voice }))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              outputChannels.voice
                ? 'bg-[#182338] text-[#8B5CF6] border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            title="Auto-speak translations via Speech Synthesis"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>

          {/* AI Avatar Presenting Toggle */}
          <button
            type="button"
            onClick={() => setOutputChannels((p) => ({ ...p, avatar: !p.avatar }))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              outputChannels.avatar
                ? 'bg-[#8B5CF6]/20 text-[#22D3EE] border border-[#8B5CF6]/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            title="Present sign translations via 3D Sign Language Avatar"
          >
            <Layers className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>AI Avatar</span>
          </button>
        </div>
      </div>

      {/* Turn Switch Notice Toast */}
      {turnSwitchNotice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#22D3EE]/20 to-[#8B5CF6]/20 border border-[#22D3EE]/40 text-xs text-white font-medium shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
          <ArrowRightLeft className="w-4 h-4 text-[#22D3EE] animate-pulse" />
          <span>{turnSwitchNotice}</span>
        </div>
      )}

      {/* Main 3-Column Conversation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT COLUMN (Cols 1-4): Input Console (Text, Voice, Camera) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#121A2B] rounded-2xl border border-white/5 p-4 shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              {/* Active Speaker Switcher with Live Turn Badge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Current Speaker Turn
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-Switch Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#0B1020] p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSenderRole('signer');
                      setInputModality(isCameraActive ? 'camera' : 'text');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
                      activeSenderRole === 'signer'
                        ? 'bg-[#8B5CF6] text-white shadow-md ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span className="truncate">Signer ({currentSignLang.code})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSenderRole('speaker');
                      setInputModality('voice');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
                      activeSenderRole === 'speaker'
                        ? 'bg-[#22D3EE] text-slate-950 shadow-md font-bold ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">Speaker ({currentSpokenLang.code})</span>
                  </button>
                </div>
              </div>

              {/* Input Modality Tabs: Text | Voice | Camera */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Input Channel
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {inputModality} Input Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-[#0B1020] p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setInputModality('text')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      inputModality === 'text'
                        ? 'bg-[#182338] text-[#22D3EE] border border-white/10 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputModality('voice')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      inputModality === 'voice'
                        ? 'bg-[#182338] text-[#8B5CF6] border border-white/10 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputModality('camera')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      inputModality === 'camera'
                        ? 'bg-[#182338] text-[#22D3EE] border border-white/10 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                </div>
              </div>

              {/* MODALITY 1: CAMERA INPUT */}
              {inputModality === 'camera' && (
                <div className="space-y-3">
                  {/* Feed Mode Switcher Toolbar */}
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Video Stream Source
                    </span>
                    <div className="flex items-center gap-1 bg-[#0B1020] p-0.5 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => handleSwitchFeedMode(false)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                          isCameraActive && !useDemoSignFeed
                            ? 'bg-[#22D3EE]/20 text-[#22D3EE] font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Live Webcam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchFeedMode(true)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                          isCameraActive && useDemoSignFeed
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Virtual Sign Feed
                      </button>
                    </div>
                  </div>

                  {/* Live Camera Viewport */}
                  <div className="relative aspect-video rounded-xl bg-[#070A14] overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                    {/* Video element is persistently mounted and active during streaming */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                      } ${isCameraActive ? 'block' : 'hidden'}`}
                    />

                    {/* Virtual Sign Demonstration Feed Fallback Overlay */}
                    {isCameraActive && useDemoSignFeed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-5">
                        <img
                          src="/src/assets/images/sign_learning_hands_1792593294940.jpg"
                          alt="Virtual Sign Language Feed"
                          className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-amber-300 bg-black/75 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-amber-500/30">
                          <span className="font-medium">Virtual Sign Stream Active</span>
                          <span>Click gestures below to translate</span>
                        </div>
                      </div>
                    )}

                    {/* Landmark canvas overlay */}
                    <canvas
                      ref={canvasRef}
                      className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                        cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                      } ${isCameraActive ? 'block' : 'hidden'}`}
                    />

                    {isCameraActive ? (
                      <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{useDemoSignFeed ? 'Virtual Sign Stream' : 'Live Camera Stream'}</span>
                      </div>
                    ) : (
                      <div className="text-center p-4 space-y-2.5 text-slate-400 z-10">
                        <Camera className="w-8 h-8 mx-auto text-[#8B5CF6]" />
                        <div>
                          <span className="text-xs block text-slate-200 font-medium">
                            Camera Standby
                          </span>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                            Connect your webcam or use the virtual sign feed to test continuous translation.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleToggleCamera}
                            className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg text-xs font-semibold text-white transition shadow-sm"
                          >
                            Start Webcam
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchFeedMode(true)}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition"
                          >
                            Virtual Sign Feed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-start justify-between gap-2">
                      <span>{cameraError}</span>
                      <button
                        type="button"
                        onClick={() => handleSwitchFeedMode(true)}
                        className="underline text-amber-300 whitespace-nowrap text-[10px]"
                      >
                        Try Virtual Stream
                      </button>
                    </div>
                  )}

                  {/* Camera Toolbar */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        isCameraActive
                          ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200'
                          : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md'
                      }`}
                    >
                      {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                    </button>

                    {isCameraActive && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSwitchFeedMode(!useDemoSignFeed)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1 ${
                            useDemoSignFeed
                              ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                              : 'bg-[#182338] border-white/10 text-slate-300 hover:text-white'
                          }`}
                          title="Switch between live physical camera and virtual sign demonstration feed"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">{useDemoSignFeed ? 'Virtual' : 'Webcam'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFlipCamera}
                          disabled={useDemoSignFeed}
                          className="p-2 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] disabled:opacity-40 border border-white/10 text-slate-300 hover:text-white transition"
                          title="Flip camera"
                          aria-label="Flip camera"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowMesh(!showMesh)}
                          className={`p-2 rounded-xl border transition ${
                            showMesh
                              ? 'bg-[#22D3EE]/20 border-[#22D3EE]/40 text-[#22D3EE]'
                              : 'bg-[#182338] border-white/10 text-slate-400'
                          }`}
                          title="Toggle landmark mesh guide"
                          aria-label="Toggle landmark mesh"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Quick Sign Recognition Presets */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Recognize Sign Gesture
                      </span>
                      {isTranslatingDelay && (
                        <span className="text-[10px] text-amber-400 font-mono animate-pulse">
                          Processing ({delayCountdown.toFixed(1)}s)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {quickSignGestures.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isTranslatingDelay}
                          onClick={() => handleTriggerQuickSign(item)}
                          className="text-left p-2 rounded-xl bg-[#182338]/80 hover:bg-[#182338] disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 hover:border-[#8B5CF6]/50 text-xs text-white transition flex flex-col gap-0.5 group"
                        >
                          <span className="font-semibold text-[11px] group-hover:text-[#22D3EE] transition-colors truncate">
                            {item.gestureLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            "{item.sign}"
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODALITY 2: VOICE INPUT */}
              {inputModality === 'voice' && (
                <div className="space-y-4 py-2">
                  <div className="rounded-xl bg-[#0B1020]/70 p-5 border border-white/5 text-center space-y-4">
                    <button
                      type="button"
                      disabled={isTranslatingDelay}
                      onClick={handleToggleMic}
                      className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListeningMic
                          ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/40 animate-pulse scale-105'
                          : 'bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-[#8B5CF6]/25'
                      }`}
                      aria-label={isListeningMic ? 'Stop microphone' : 'Start microphone'}
                    >
                      {isListeningMic ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>

                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        {isListeningMic
                          ? 'Listening to speech...'
                          : `Tap to speak as ${activeSenderRole === 'signer' ? `Signer (${currentSignLang.name})` : `Speaker (${currentSpokenLang.name})`}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Speech will be translated after a 5s neural synthesis delay, followed by turn switch.
                      </p>
                    </div>

                    {speechInterim && (
                      <div className="p-3 rounded-lg bg-[#182338] border border-white/10 text-xs text-slate-200 italic">
                        "{speechInterim}"
                      </div>
                    )}

                    {speechError && (
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300">
                        {speechError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODALITY 3: TEXT INPUT */}
              {inputModality === 'text' && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={textInput}
                    disabled={isTranslatingDelay}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleInitiateMessage(textInput, 'text');
                      }
                    }}
                    placeholder={`Type message as ${activeSenderRole === 'signer' ? `Signer (${currentSignLang.name})` : `Speaker (${currentSpokenLang.name})`}...`}
                    className="w-full p-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6] resize-none disabled:opacity-50"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Press Enter to send
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInitiateMessage(textInput, 'text')}
                      disabled={!textInput.trim() || isTranslatingDelay}
                      className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy footnote */}
            <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All inputs (Camera, Voice, Text) stay private on this device.</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (Cols 5-8): Live Conversation Transcript */}
        <div className={`flex flex-col bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl min-h-[560px] ${
          outputChannels.avatar ? 'lg:col-span-5' : 'lg:col-span-8'
        }`}>
          {/* Transcript Header with Active Turn Indicator */}
          <div className="px-5 py-3 border-b border-white/5 bg-[#0B1020]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#22D3EE]" />
              <h3 className="text-sm font-semibold text-white">Live Translated Transcript</h3>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 font-semibold">
                Turn: {activeSenderRole === 'signer' ? `A (${currentSignLang.code})` : `B (${currentSpokenLang.code})`}
              </span>
              <span aria-hidden="true">·</span>
              <span>{messages.length} msg{messages.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4">
            {messages.length === 0 && !isTranslatingDelay ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-400" />
                <p className="text-xs">
                  No conversation messages yet. Select an input channel (Camera, Voice, or Text) to begin.
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoConversation}
                  className="px-3.5 py-1.5 rounded-xl bg-[#182338] border border-white/10 text-[#22D3EE] text-xs font-medium hover:bg-white/5 transition"
                >
                  Load Sample Dialogue
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isSigner = msg.senderRole === 'signer';
                  const isCurrentAvatarTarget = activePresentingMessage?.id === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1.5 max-w-[90%] ${
                        isSigner ? 'mr-auto items-start' : 'ml-auto items-end text-right'
                      }`}
                    >
                      {/* Header info */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-white">{msg.senderName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#22D3EE] uppercase">
                          {msg.inputModality || 'Input'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Chat Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isSigner
                            ? 'bg-[#182338] text-white border border-[#8B5CF6]/30'
                            : 'bg-[#22D3EE]/20 text-[#F8FAFC] border border-[#22D3EE]/30'
                        } ${isCurrentAvatarTarget ? 'ring-2 ring-[#22D3EE]/50' : ''}`}
                      >
                        <div className="font-semibold text-base mb-1">{msg.originalText}</div>
                        <div className="text-xs text-slate-300 pt-1.5 border-t border-white/10 font-normal">
                          {msg.translatedText}
                        </div>
                        {msg.glossText && (
                          <div className="text-[11px] text-[#22D3EE] font-mono pt-1">
                            Sign Gloss: {msg.glossText}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono pt-1 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{msg.engine || 'Live Neural MT Engine'}</span>
                        </div>
                      </div>

                      {/* Actions: Listen (Voice), Present (Avatar), Copy */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {/* Voice Listen Button */}
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(msg)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition p-1 rounded hover:bg-white/5"
                          title="Read aloud using speech synthesis"
                        >
                          <Volume2 className="w-3 h-3 text-[#8B5CF6]" />
                          <span>Listen</span>
                        </button>

                        <span aria-hidden="true" className="text-slate-600">·</span>

                        {/* AI Avatar Present Button */}
                        <button
                          type="button"
                          onClick={() => handlePresentWithAvatar(msg)}
                          className={`text-[11px] flex items-center gap-1 transition p-1 rounded hover:bg-white/5 ${
                            isCurrentAvatarTarget
                              ? 'text-[#22D3EE] font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Present this message with the 3D Sign Language Avatar"
                        >
                          <Layers className="w-3 h-3 text-[#22D3EE]" />
                          <span>Present via Avatar</span>
                        </button>

                        <span aria-hidden="true" className="text-slate-600">·</span>

                        {/* Copy Action */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.translatedText, msg.id)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition p-1 rounded hover:bg-white/5"
                          title="Copy translation"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* ACTIVE 5-SECOND TRANSLATION DELAY COUNTDOWN CARD */}
                {isTranslatingDelay && pendingInputData && (
                  <div className="rounded-2xl bg-gradient-to-br from-[#182338] to-[#121A2B] border border-[#8B5CF6]/60 p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-ping" />
                        <span className="font-semibold text-white">
                          Translating with Real Neural Engine ({pendingInputData.senderRole === 'signer' ? `${currentSignLang.code} → ${currentSpokenLang.name}` : `${currentSpokenLang.name} → ${currentSignLang.code}`})...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#22D3EE] bg-[#0B1020] px-2.5 py-1 rounded-lg border border-[#22D3EE]/30">
                          {delayCountdown.toFixed(1)}s
                        </span>
                        <button
                          type="button"
                          onClick={handleSkipDelay}
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition"
                          title="Skip countdown and show translation immediately"
                        >
                          <FastForward className="w-3 h-3 text-[#22D3EE]" />
                          <span>Fast-Forward</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0B1020]/70 border border-white/5 text-xs text-slate-200 italic font-medium">
                      "{pendingInputData.originalText}"
                    </div>

                    {/* Live Neural Translation Preview once ready */}
                    {pendingInputData.isReady && pendingInputData.translatedText && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-200 flex items-start gap-2 animate-in fade-in duration-200">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block font-semibold">
                            Neural MT Translation Ready:
                          </span>
                          <span className="font-semibold text-white text-sm block">{pendingInputData.translatedText}</span>
                          {pendingInputData.glossText && (
                            <span className="block text-[11px] text-emerald-300/90 font-mono">
                              Sign Gloss: {pendingInputData.glossText}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Smooth progress bar over the 5 seconds */}
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#8B5CF6] via-[#22D3EE] to-[#8B5CF6] h-full transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, ((5.0 - delayCountdown) / 5.0) * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{pendingInputData.engine || 'Real Neural MT Engine'} · Mode: {pendingInputData.modality.toUpperCase()}</span>
                      <span className="text-[#22D3EE]">
                        Auto-switching to {pendingInputData.senderRole === 'signer' ? `Speaker (${currentSpokenLang.name})` : `Signer (${currentSignLang.name})`}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* RIGHT COLUMN (Cols 9-12): AI Avatar Presenting Viewport */}
        {outputChannels.avatar && (
          <div className="lg:col-span-3 h-full">
            <ConversationAvatarPresenter
              currentMessage={activePresentingMessage}
              isPlaying={isAvatarPlaying}
              onTogglePlay={() => setIsAvatarPlaying((prev) => !prev)}
              onReplay={() => setIsAvatarPlaying(true)}
              speed={avatarSpeed}
              onSpeedChange={setAvatarSpeed}
              autoPresent={autoPresent}
              onToggleAutoPresent={() => setAutoPresent(!autoPresent)}
              signLanguageName={currentSignLang.name}
            />
          </div>
        )}
      </div>
    </div>
  );
};
