// ============================================================================
// HYBRID VOICE AI SERVICE (Web Speech API + Audio MediaRecorder + Gemini Fallback)
// Ensures 100% reliable voice input on mobile phone preview, iOS Safari, Android, & desktop
// ============================================================================

export interface VoiceRecognitionOptions {
  language?: string;
  onTranscript: (finalText: string) => void;
  onInterim?: (interimText: string) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (errorMessage: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onAiProcessingStart?: () => void;
}

export interface VoiceController {
  stop: () => Promise<void>;
  cancel: () => void;
  isActive: () => boolean;
}

/**
 * Check if Web Speech API is supported natively in current browser
 */
export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Check if the current origin is a Secure Context (HTTPS or localhost)
 * Mobile browsers block getUserMedia and Web Speech API on non-HTTPS IP origins (e.g. http://192.168.x.x)
 */
export function isSecureContextOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Transcribe an audio file (e.g. from native phone voice recorder or file input) using Gemini AI
 */
export async function transcribeAudioFile(
  file: File | Blob,
  language: string = 'id'
): Promise<{ success: boolean; transcript?: string; parsed?: any; error?: string }> {
  try {
    const base64Audio = await blobToBase64(file);
    const mimeType = file.type || 'audio/webm';

    const response = await fetch('/api/voice-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType,
        language,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Server response error: ${response.status}` };
    }

    const data = await response.json();
    if (data.success && data.transcript) {
      return {
        success: true,
        transcript: data.transcript,
        parsed: data,
      };
    } else {
      return {
        success: false,
        error: data.message || 'AI tidak dapat mendeteksi ucapan pada audio.',
      };
    }
  } catch (err: any) {
    console.error('Audio file transcription failed:', err);
    return { success: false, error: err.message || 'Gagal mengirim file audio ke server.' };
  }
}

/**
 * Convert Blob to Base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).replace(/^data:[^;]+;base64,/, '');
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Hybrid Voice Recognition Controller
 * Runs Web Speech API with seamless MediaRecorder + AI fallback
 */
export async function startHybridVoiceRecognition(
  options: VoiceRecognitionOptions
): Promise<VoiceController> {
  let isRunning = true;
  let recognitionInstance: any = null;
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let audioContext: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let animFrameId: number | null = null;
  let accumulatedTranscript = '';
  let speechApiDelivered = false;

  const cleanupAudio = () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (_e) {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_e) {}
      });
      mediaStream = null;
    }
  };

  // 1. Request microphone permission & setup AudioContext for live waveform
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup audio analyzer for responsive waveform level
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          const source = audioContext.createMediaStreamSource(mediaStream);
          analyserNode = audioContext.createAnalyser();
          analyserNode.fftSize = 64;
          source.connect(analyserNode);

          const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!isRunning || !analyserNode) return;
            analyserNode.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            // Scale 1 to 8 for UI bars
            const level = Math.max(1, Math.min(8, Math.round((average / 255) * 8)));
            if (options.onAudioLevel) {
              options.onAudioLevel(level);
            }
            animFrameId = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (_ctxErr) {
        console.warn('AudioContext setup skipped:', _ctxErr);
      }

      // Setup MediaRecorder for backend AI fallback
      if (typeof MediaRecorder !== 'undefined') {
        try {
          let mimeType = 'audio/webm;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : MediaRecorder.isTypeSupported('audio/ogg')
              ? 'audio/ogg'
              : '';
          }

          const recorderOptions = mimeType ? { mimeType } : undefined;
          mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);
          audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.start(250); // Collect every 250ms
        } catch (_recErr) {
          console.warn('MediaRecorder init error:', _recErr);
        }
      }
    }
  } catch (micErr: any) {
    console.warn('Microphone permission or capture error:', micErr);
    if (options.onError) {
      if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
        options.onError('Izin mikrofon ditolak oleh browser. Silakan izinkan akses mikrofon atau gunakan tombol contoh suara.');
      } else {
        options.onError(`Gagal mengakses mikrofon: ${micErr.message || micErr.name}`);
      }
    }
    if (options.onEnd) options.onEnd();
    return {
      stop: async () => {},
      cancel: () => {},
      isActive: () => false,
    };
  }

  // 2. Initialize Web Speech API if supported
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = options.language === 'en' ? 'en-US' : 'id-ID';
      // Mobile browsers work much more reliably with continuous = false
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          accumulatedTranscript = (accumulatedTranscript + ' ' + final).trim();
          speechApiDelivered = true;
          options.onTranscript(accumulatedTranscript);
        }
        if (interim && options.onInterim) {
          options.onInterim(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Web Speech Recognition event error:', event.error);
        // If error is no-speech, keep listening if still running
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          // Will fallback to recorded audio on stop
        }
      };

      recognition.onend = () => {
        // If user is still actively recording on mobile, attempt smooth restart
        if (isRunning && !speechApiDelivered) {
          try {
            recognition.start();
          } catch (_e) {}
        }
      };

      recognition.start();
      recognitionInstance = recognition;
    } catch (_speechErr) {
      console.warn('SpeechRecognition start failed, will use MediaRecorder fallback:', _speechErr);
    }
  }

  if (options.onStart) {
    options.onStart();
  }

  // Stop Controller
  const stop = async () => {
    if (!isRunning) return;
    isRunning = false;

    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (_e) {}
    }

    // Stop recorder and wait for final audio chunks to flush
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (mediaRecorder) {
          mediaRecorder.onstop = () => resolve();
          try {
            mediaRecorder.stop();
          } catch (_e) {
            resolve();
          }
        } else {
          resolve();
        }
      });
    }

    cleanupAudio();

    // If Web Speech API already delivered text, we are done!
    if (speechApiDelivered && accumulatedTranscript.trim()) {
      options.onTranscript(accumulatedTranscript.trim());
      if (options.onEnd) options.onEnd();
      return;
    }

    // Otherwise, perform AI Audio Transcription fallback using Gemini backend
    if (audioChunks.length > 0) {
      if (options.onAiProcessingStart) {
        options.onAiProcessingStart();
      }

      try {
        const audioBlob = new Blob(audioChunks, {
          type: mediaRecorder?.mimeType || 'audio/webm',
        });

        // Send if audio blob has data (> 200 bytes)
        if (audioBlob.size > 200) {
          const base64Audio = await blobToBase64(audioBlob);
          const response = await fetch('/api/voice-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: audioBlob.type || 'audio/webm',
              language: options.language || 'id',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.transcript) {
              options.onTranscript(data.transcript);
              if (options.onEnd) options.onEnd();
              return;
            } else if (data.error && options.onError) {
              options.onError(data.error);
            }
          }
        }
      } catch (aiErr: any) {
        console.warn('AI voice transcribe fallback error:', aiErr);
        if (options.onError) {
          options.onError(aiErr.message || 'Gagal mentranskripsi suara dengan AI.');
        }
      }
    }

    // Final end notification
    if (options.onEnd) options.onEnd();
  };

  const cancel = () => {
    isRunning = false;
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch (_e) {}
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch (_e) {}
    }
    cleanupAudio();
    if (options.onEnd) options.onEnd();
  };

  return {
    stop,
    cancel,
    isActive: () => isRunning,
  };
}
