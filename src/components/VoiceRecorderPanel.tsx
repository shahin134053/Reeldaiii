import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import {
  buildRecordedFileName,
  computeWaveformBars,
  encodePcmToWavArrayBuffer,
  formatRecorderTimer,
  selectSupportedRecorderMimeType,
} from '../lib/voiceRecorder';
import { AppLang, L } from '../lib/i18n';

interface VoiceRecorderPanelProps {
  lang: AppLang;
  /** Optional story script to display in the built-in reading teleprompter while recording */
  scriptPreviewText?: string;
  /** Currently attached audio file name (so the panel reflects active attachment state) */
  attachedFileName?: string | null;
  onAttachRecording: (payload: {
    audioUrl: string;
    fileName: string;
    duration: number;
  }) => void;
}

type RecorderPhase = 'idle' | 'recording' | 'paused' | 'recorded';

const BAR_COUNT = 24;
const IDLE_BARS = Array.from({ length: BAR_COUNT }, () => 0.1);

export const VoiceRecorderPanel: React.FC<VoiceRecorderPanelProps> = ({
  lang,
  scriptPreviewText = '',
  attachedFileName,
  onAttachRecording,
}) => {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [bars, setBars] = useState<number[]>(IDLE_BARS);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedFileName, setRecordedFileName] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const segmentStartMsRef = useRef<number>(0);
  const latestBlobUrlRef = useRef<string | null>(null);

  const cleanupHardware = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupHardware();
    };
  }, [cleanupHardware]);

  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const loop = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(data);
      setBars(computeWaveformBars(data, BAR_COUNT));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startTimerLoop = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = window.setInterval(() => {
      const now = performance.now();
      const totalMs = accumulatedMsRef.current + (now - segmentStartMsRef.current);
      setElapsedSec(totalMs / 1000);
    }, 120);
  }, []);

  const handleStartRecording = async () => {
    setErrorMsg(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setErrorMsg(
        L(
          lang,
          'Microphone recording is not supported in this browser. Please upload an MP3/WAV file instead.',
          'এই ব্রাউজারে মাইক্রোফোন রেকর্ডিং সাপোর্ট করছে না। অনুগ্রহ করে MP3 বা WAV ফাইল আপলোড করুন।'
        )
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const preferredMime = selectSupportedRecorderMimeType(
        typeof MediaRecorder.isTypeSupported === 'function'
          ? (m) => MediaRecorder.isTypeSupported(m)
          : undefined
      );
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      // Live audio level meter via Web Audio API
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      mediaRecorderRef.current = recorder;
      accumulatedMsRef.current = 0;
      segmentStartMsRef.current = performance.now();
      setElapsedSec(0);
      setRecordedUrl(null);
      setRecordedFileName(null);
      setPhase('recording');

      recorder.start(250);
      startWaveformLoop();
      startTimerLoop();
    } catch (err) {
      cleanupHardware();
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg(
          L(
            lang,
            'Microphone access was blocked. Allow microphone permission in your browser bar and try again.',
            'মাইক্রোফোন ব্যবহারের অনুমতি বন্ধ আছে। ব্রাউজার থেকে মাইক্রোফোন পারমিশন চালু করে আবার চেষ্টা করুন।'
          )
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMsg(
          L(
            lang,
            'No microphone device was found. Connect a microphone or upload an audio file.',
            'কোনো মাইক্রোফোন পাওয়া যায়নি। মাইক্রোফোন সংযুক্ত করুন অথবা অডিও ফাইল আপলোড করুন।'
          )
        );
      } else {
        setErrorMsg(
          L(
            lang,
            'Unable to start microphone recording right now. Please try again or upload an audio file.',
            'এই মুহূর্তে রেকর্ডিং শুরু করা যায়নি। আবার চেষ্টা করুন অথবা অডিও ফাইল আপলোড করুন।'
          )
        );
      }
    }
  };

  const handlePauseResume = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;

    if (phase === 'recording' && rec.state === 'recording') {
      rec.pause();
      accumulatedMsRef.current += performance.now() - segmentStartMsRef.current;
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setBars(IDLE_BARS);
      setPhase('paused');
    } else if (phase === 'paused' && rec.state === 'paused') {
      rec.resume();
      segmentStartMsRef.current = performance.now();
      setPhase('recording');
      startWaveformLoop();
      startTimerLoop();
    }
  };

  const handleStopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;

    const finalMs =
      phase === 'recording'
        ? accumulatedMsRef.current + (performance.now() - segmentStartMsRef.current)
        : accumulatedMsRef.current;
    const measuredDuration = Math.max(0.5, Number((finalMs / 1000).toFixed(2)));

    setIsFinalizing(true);
    rec.onstop = async () => {
      const mime = rec.mimeType || 'audio/webm';
      const rawBlob = new Blob(chunksRef.current, { type: mime });
      cleanupHardware();

      let finalBlob = rawBlob;
      let finalMime = mime;
      let finalDuration = measuredDuration;

      // Convert to clean PCM16 WAV when decodable so duration & waveform analysis are 100% exact
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx && rawBlob.size > 0) {
          const decodeCtx = new AudioCtx();
          try {
            const arrayBuf = await rawBlob.arrayBuffer();
            const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
            const channel = decoded.getChannelData(0);
            const wavBuf = encodePcmToWavArrayBuffer(channel, decoded.sampleRate);
            finalBlob = new Blob([wavBuf], { type: 'audio/wav' });
            finalMime = 'audio/wav';
            if (Number.isFinite(decoded.duration) && decoded.duration > 0.2) {
              finalDuration = Number(decoded.duration.toFixed(2));
            }
          } finally {
            await decodeCtx.close().catch(() => {});
          }
        }
      } catch {
        // Fallback smoothly to original MediaRecorder blob with measured duration
      }

      const objectUrl = URL.createObjectURL(finalBlob);
      const fileName = buildRecordedFileName(new Date(), finalMime);
      latestBlobUrlRef.current = objectUrl;

      setRecordedUrl(objectUrl);
      setRecordedFileName(fileName);
      setRecordedDuration(finalDuration);
      setElapsedSec(finalDuration);
      setBars(IDLE_BARS);
      setIsFinalizing(false);
      setPhase('recorded');

      // Attach immediately as the active voiceover audio
      onAttachRecording({
        audioUrl: objectUrl,
        fileName,
        duration: finalDuration,
      });
    };

    try {
      rec.stop();
    } catch {
      cleanupHardware();
      setIsFinalizing(false);
      setPhase('idle');
    }
  };

  const handleReset = () => {
    cleanupHardware();
    setPhase('idle');
    setElapsedSec(0);
    setRecordedUrl(null);
    setRecordedFileName(null);
    setRecordedDuration(0);
    setBars(IDLE_BARS);
    setErrorMsg(null);
  };

  const isCurrentlyAttached =
    Boolean(recordedFileName) && attachedFileName === recordedFileName;

  return (
    <div
      data-testid="voice-recorder-panel"
      className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-4 sm:p-5 space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              phase === 'recording'
                ? 'bg-red-500/15 text-red-400'
                : 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]'
            }`}
          >
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--ck-text)]">
              {L(lang, 'In-Browser Voiceover Recorder', 'ইন-ব্রাউজার বাংলা ভয়েস রেকর্ডার')}
            </div>
            <p className="text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Narrate your story directly into your microphone — attaches instantly as your project audio.',
                'আলাদা অ্যাপ ছাড়াই সরাসরি মাইক্রোফোনে গল্প পড়ে রেকর্ড করুন — সাথে সাথেই অডিও হিসেবে যুক্ত হয়ে যাবে।'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="recorder-teleprompter-toggle"
          onClick={() => setShowTeleprompter((v) => !v)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
            showTeleprompter
              ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
              : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-accent)]'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{L(lang, 'Teleprompter', 'স্ক্রিপ্ট প্রম্পটার')}</span>
        </button>
      </div>

      {/* Optional Reading Teleprompter */}
      {showTeleprompter && (
        <div
          data-testid="recorder-teleprompter-box"
          className="max-h-36 overflow-y-auto rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3.5 text-sm leading-relaxed text-[var(--ck-text)]"
        >
          {scriptPreviewText.trim() ? (
            scriptPreviewText
          ) : (
            <span className="text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Write or paste your story script below (or load a Story Template) to read it smoothly here while recording.',
                'রেকর্ড করার সময় দেখে পড়ার জন্য নিচে আপনার গল্পের স্ক্রিপ্ট লিখুন অথবা উপরের যেকোনো টেমপ্লেট থেকে স্যাম্পল স্ক্রিপ্ট লোড করুন।'
              )}
            </span>
          )}
        </div>
      )}

      {/* Live Waveform Meter & Timer */}
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex h-10 flex-1 items-center justify-center gap-1"
          aria-hidden="true"
        >
          {bars.map((height, idx) => (
            <span
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                phase === 'recording'
                  ? 'bg-red-400'
                  : phase === 'recorded'
                    ? 'bg-[var(--ck-success)]'
                    : 'bg-[var(--ck-border-strong)]'
              }`}
              style={{
                height: `${Math.round(height * 36)}px`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            {phase === 'recording' && (
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            )}
            <span
              data-testid="recorder-timer"
              className="font-mono text-base font-semibold tabular-nums text-[var(--ck-text)]"
            >
              {formatRecorderTimer(elapsedSec)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'idle' && (
              <button
                type="button"
                data-testid="recorder-start-btn"
                onClick={() => void handleStartRecording()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>{L(lang, 'Start Recording', 'রেকর্ডিং শুরু করুন')}</span>
              </button>
            )}

            {(phase === 'recording' || phase === 'paused') && (
              <>
                <button
                  type="button"
                  data-testid="recorder-pause-btn"
                  onClick={handlePauseResume}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap"
                >
                  {phase === 'recording' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>{L(lang, 'Pause', 'বিরতি')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>{L(lang, 'Resume', 'চালু করুন')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  data-testid="recorder-stop-btn"
                  disabled={isFinalizing}
                  onClick={handleStopRecording}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60 whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>
                    {isFinalizing
                      ? L(lang, 'Saving…', 'সেভ হচ্ছে…')
                      : L(lang, 'Stop & Attach', 'থামুন ও যুক্ত করুন')}
                  </span>
                </button>
              </>
            )}

            {phase === 'recorded' && (
              <button
                type="button"
                data-testid="recorder-rerecord-btn"
                onClick={handleReset}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{L(lang, 'Record Again', 'আবার রেকর্ড করুন')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recorded Playback & Attachment Confirmation */}
      {phase === 'recorded' && recordedUrl && (
        <div
          data-testid="recorder-preview-bar"
          className="flex flex-col gap-3 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--ck-success-text)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ck-success)]" />
            <span>
              {isCurrentlyAttached
                ? L(
                    lang,
                    `Attached as voiceover (${formatRecorderTimer(recordedDuration)})`,
                    `ভয়েসওভার হিসেবে যুক্ত হয়েছে (${formatRecorderTimer(recordedDuration)})`
                  )
                : L(
                    lang,
                    `Recording ready (${formatRecorderTimer(recordedDuration)})`,
                    `রেকর্ডিং প্রস্তুত (${formatRecorderTimer(recordedDuration)})`
                  )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <audio
              controls
              src={recordedUrl}
              className="h-8 max-w-[230px]"
            />
            {!isCurrentlyAttached && recordedFileName && (
              <button
                type="button"
                onClick={() =>
                  onAttachRecording({
                    audioUrl: recordedUrl,
                    fileName: recordedFileName,
                    duration: recordedDuration,
                  })
                }
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--ck-accent)] px-3 text-xs font-semibold text-[var(--ck-accent-fg)]"
              >
                {L(lang, 'Use Audio', 'অডিও যুক্ত করুন')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clear Error Feedback */}
      {errorMsg && (
        <div
          role="alert"
          data-testid="recorder-error-msg"
          className="flex items-start gap-2 rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-3 py-2.5 text-xs text-[var(--ck-danger-text)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
