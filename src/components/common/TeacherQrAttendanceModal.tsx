import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Camera, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Building2, UserCheck, RefreshCw, Sparkles, X, Download, Printer,
  Volume2, VolumeX, Smartphone, SwitchCamera, Zap, LogIn, LogOut
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Teacher, TeacherAttendanceRecord, StaffWorkingHoursConfig } from '../../types';
import { saveTeacherAttendanceRecord, subscribeSettings } from '../../services/dbService';

interface TeacherQrAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher?: Teacher | null;
  teachersList: Teacher[];
  attendanceRecords: TeacherAttendanceRecord[];
  onAttendanceUpdated?: (record: TeacherAttendanceRecord) => void;
  initialMode?: 'scan_office_qr' | 'office_terminal' | 'my_qr_badge';
  hideOfficeTerminal?: boolean;
}

export default function TeacherQrAttendanceModal({
  isOpen,
  onClose,
  currentTeacher,
  teachersList,
  attendanceRecords,
  onAttendanceUpdated,
  initialMode = 'scan_office_qr',
  hideOfficeTerminal = false
}: TeacherQrAttendanceModalProps) {
  const [activeTab, setActiveTab] = useState<'scan_office_qr' | 'office_terminal' | 'my_qr_badge'>(
    hideOfficeTerminal && initialMode === 'office_terminal' ? 'scan_office_qr' : initialMode
  );

  useEffect(() => {
    if (hideOfficeTerminal && activeTab === 'office_terminal') {
      setActiveTab('scan_office_qr');
    }
  }, [hideOfficeTerminal, activeTab]);
  
  // Office Station Daily QR Code URL & Staff Badge
  const [officeQrDataUrl, setOfficeQrDataUrl] = useState<string>('');
  const [myBadgeQrDataUrl, setMyBadgeQrDataUrl] = useState<string>('');

  // Real-Time Scanning State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [scanResult, setScanResult] = useState<{ record: TeacherAttendanceRecord; actionType: 'sign_in' | 'sign_out' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [scanSuccessPulse, setScanSuccessPulse] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const isScanningLockedRef = useRef<boolean>(false);

  // Admin Configured Working Periods
  const [workingHours, setWorkingHours] = useState<StaffWorkingHoursConfig>({
    startTime: '07:30',
    latenessCutoff: '08:00',
    closingTime: '15:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    gracePeriodMinutes: 5
  });

  useEffect(() => {
    const unsub = subscribeSettings((settings) => {
      if (settings?.workingHours) {
        setWorkingHours(settings.workingHours);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);
  
  const [selectedTeacherForTerminal, setSelectedTeacherForTerminal] = useState<string>(
    currentTeacher?.id || (teachersList[0]?.id || '')
  );

  const [modalServerClock, setModalServerClock] = useState<Date>(new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setModalServerClock(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Generate QR code for Office Terminal Station
  useEffect(() => {
    const officePayload = JSON.stringify({
      type: 'JIPAS_OFFICE_ATTENDANCE_STATION',
      stationId: 'JIPAS-MAIN-OFFICE-STATION-01',
      date: todayDateStr,
      school: 'JIPAS ACADEMY',
      timestamp: Date.now()
    });

    QRCode.toDataURL(officePayload, { width: 320, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(url => setOfficeQrDataUrl(url))
      .catch(err => console.error('Error generating office QR:', err));
  }, [todayDateStr]);

  // Generate QR code for Current Teacher Badge
  useEffect(() => {
    const teacher = currentTeacher || teachersList.find(t => t.id === selectedTeacherForTerminal) || teachersList[0];
    if (teacher) {
      const badgePayload = JSON.stringify({
        type: 'JIPAS_STAFF_BADGE',
        teacherId: teacher.id,
        teacherName: teacher.name,
        staffId: teacher.staffId || teacher.id,
        designation: teacher.designation || 'Staff',
        school: 'JIPAS ACADEMY'
      });

      QRCode.toDataURL(badgePayload, { width: 320, margin: 2, color: { dark: '#047857', light: '#ffffff' } })
        .then(url => setMyBadgeQrDataUrl(url))
        .catch(err => console.error('Error generating badge QR:', err));
    }
  }, [currentTeacher, selectedTeacherForTerminal, teachersList]);

  // Camera Management Lifecycle
  useEffect(() => {
    if (isOpen && isCameraActive && activeTab === 'scan_office_qr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, isCameraActive, activeTab, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream API is restricted or not supported by browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }

      // Check flashlight capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities && capabilities.torch) {
          setIsTorchSupported(true);
        } else {
          setIsTorchSupported(false);
        }
      }

      // Start continuous real-time QR scanning loop
      startQrDecodingLoop();
    } catch (err: any) {
      console.warn('Camera stream initiation notice:', err);
      setCameraError(err.message || 'Camera permission was restricted or is not available in browser preview sandbox.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchSupported) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        } as any);
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch toggle not accepted:', err);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Real-Time Frame Decoding Loop via Canvas & jsQR
  const startQrDecodingLoop = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (decoded && decoded.data && !isScanningLockedRef.current) {
            handleDecodedQrContent(decoded.data);
          }
        } catch (e) {
          // Frame read exception safeguard
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Process Decoded Payload
  const handleDecodedQrContent = (rawText: string) => {
    if (isScanningLockedRef.current) return;
    isScanningLockedRef.current = true;
    setLastScannedPayload(rawText);
    setScanSuccessPulse(true);
    setTimeout(() => setScanSuccessPulse(false), 2500);

    // Haptic vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([120, 60, 120]);
    }

    let targetTeacherToClock = currentTeacher || teachersList.find(t => t.id === selectedTeacherForTerminal) || teachersList[0];
    let methodNote = 'Real-Time Live Optical Scanner';

    try {
      const parsed = JSON.parse(rawText);
      if (parsed.type === 'JIPAS_STAFF_BADGE' && parsed.teacherId) {
        const matched = teachersList.find(t => t.id === parsed.teacherId || t.staffId === parsed.staffId);
        if (matched) {
          targetTeacherToClock = matched;
          methodNote = `Staff QR Badge (${parsed.teacherName || matched.name})`;
        }
      } else if (parsed.type === 'JIPAS_OFFICE_ATTENDANCE_STATION') {
        methodNote = 'JIPAS Reception Office Station QR';
      }
    } catch (e) {
      // Plain text payload
    }

    if (targetTeacherToClock) {
      handleScanAttendance(targetTeacherToClock, methodNote);
    }

    // Cooldown timer to prevent accidental double-scans
    setCooldownRemaining(6);
    let count = 6;
    const cooldownInterval = setInterval(() => {
      count -= 1;
      setCooldownRemaining(count);
      if (count <= 0) {
        clearInterval(cooldownInterval);
        isScanningLockedRef.current = false;
        setLastScannedPayload(null);
      }
    }, 1000);
  };

  // Audio Feedback Chime with distinct signatures for Arrival vs Departure
  const playChime = (actionType: 'sign_in' | 'sign_out') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';

      if (actionType === 'sign_in') {
        // Ascending harmonic chime for Sign In
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      } else {
        // Melodic departure chime for Sign Out / Close of School
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.24); // C5
      }

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio fallback
    }
  };

  // Automated Attendance Logger:
  // First scan of day -> Automatic Sign In
  // Scan again same day -> Automatic Sign Out (close of school)
  const handleScanAttendance = async (
    teacherToClock: Teacher, 
    methodNote: string = 'Real-Time Live Optical Scanner',
    forceAction?: 'sign_in' | 'sign_out'
  ) => {
    setIsProcessing(true);
    setScanResult(null);

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedHours = displayHours < 10 ? `0${displayHours}` : displayHours;
    const currentTimeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;

    // Look up existing attendance record for today
    const existingRecord = attendanceRecords.find(
      r => r.date === todayDateStr && (r.teacherId === teacherToClock.id || r.teacherId === teacherToClock.staffId)
    );

    let updatedRecord: TeacherAttendanceRecord;
    let actionType: 'sign_in' | 'sign_out' = 'sign_in';

    if (forceAction === 'sign_out' || (!forceAction && existingRecord && existingRecord.timeIn)) {
      // Second scan of day: Automatic SIGN OUT (Close of School)
      actionType = 'sign_out';
      updatedRecord = {
        id: existingRecord?.id || `tar-${teacherToClock.id}-${todayDateStr}`,
        date: todayDateStr,
        teacherId: teacherToClock.id,
        teacherName: teacherToClock.name,
        status: existingRecord?.status || 'Present',
        timeIn: existingRecord?.timeIn || currentTimeStr,
        timeOut: currentTimeStr,
        remarks: existingRecord?.timeOut 
          ? `Departure updated via ${methodNote} at ${currentTimeStr}`
          : `Signed Out automatically (Close of School) via ${methodNote} at ${currentTimeStr}`,
        clockInMethod: existingRecord?.clockInMethod || methodNote,
        verified: true,
        officeStationId: 'JIPAS-MAIN-OFFICE-STATION-01'
      };
    } else {
      // First scan of the day: Automatic SIGN IN
      actionType = 'sign_in';

      // Evaluate lateness based on Admin-configured Working Periods
      const [cutoffH, cutoffM] = (workingHours.latenessCutoff || '08:00').split(':').map(Number);
      const grace = Number(workingHours.gracePeriodMinutes || 0);
      const cutoffTotalMins = (cutoffH * 60) + cutoffM + grace;
      const currentTotalMins = (hours * 60) + minutes;

      const isLate = currentTotalMins > cutoffTotalMins;
      const status: 'Present' | 'Late' = isLate ? 'Late' : 'Present';
      const recordId = existingRecord?.id || `tar-${teacherToClock.id}-${todayDateStr}`;

      updatedRecord = {
        id: recordId,
        date: todayDateStr,
        teacherId: teacherToClock.id,
        teacherName: teacherToClock.name,
        status,
        timeIn: currentTimeStr,
        timeOut: existingRecord?.timeOut,
        remarks: `Signed In automatically via ${methodNote} at ${currentTimeStr}`,
        clockInMethod: methodNote,
        verified: true,
        officeStationId: 'JIPAS-MAIN-OFFICE-STATION-01'
      };
    }

    try {
      await saveTeacherAttendanceRecord(updatedRecord);
      if (onAttendanceUpdated) {
        onAttendanceUpdated(updatedRecord);
      }
      playChime(actionType);
      setScanResult({ record: updatedRecord, actionType });
    } catch (err) {
      console.error('Failed to save teacher attendance:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const activeTeacher = currentTeacher || teachersList.find(t => t.id === selectedTeacherForTerminal) || teachersList[0];
  const todayRecords = attendanceRecords.filter(r => r.date === todayDateStr);
  const activeTeacherTodayRecord = todayRecords.find(r => r.teacherId === activeTeacher?.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Hidden processing canvas for real-time frame scanning */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scanLaser {
          0% { top: 6%; opacity: 0.9; }
          50% { top: 88%; opacity: 0.9; }
          100% { top: 6%; opacity: 0.9; }
        }
        .animate-scan-laser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/60 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/30 shadow-inner">
              <QrCode className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">Office QR Attendance System</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 tracking-wide uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Camera Scanner
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">
                Real-time optical camera scanning for daily Sign In & Sign Out attendance logs.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-right hidden sm:block">
              <div className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                Server Clock
              </div>
              <div className="text-xs font-mono font-black text-emerald-300">
                {modalServerClock.toLocaleTimeString()}
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-100 p-2 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('scan_office_qr'); setIsCameraActive(true); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'scan_office_qr'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            SCAN  (to Sign-In/Out to register)
          </button>

          {!hideOfficeTerminal && (
            <button
              onClick={() => { setActiveTab('office_terminal'); setIsCameraActive(false); }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'office_terminal'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Office Terminal Display
            </button>
          )}

          <button
            onClick={() => { setActiveTab('my_qr_badge'); setIsCameraActive(false); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'my_qr_badge'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            My Staff QR Badge
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: LIVE CAMERA SCANNING (REAL-TIME OPTICAL SCANNER) */}
          {activeTab === 'scan_office_qr' && (
            <div className="space-y-4">
              {/* Current Teacher Info Header with Sign In & Sign Out status */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm border border-indigo-400/40 shadow-xs">
                    {activeTeacher?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{activeTeacher?.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{activeTeacher?.designation || 'Class Teacher'} • Staff ID: {activeTeacher?.staffId || activeTeacher?.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sign In</div>
                    {activeTeacherTodayRecord?.timeIn ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-black inline-flex items-center gap-1">
                        <LogIn className="w-3 h-3 text-emerald-600" />
                        {activeTeacherTodayRecord.timeIn}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold">Pending</span>
                    )}
                  </div>

                  <div className="h-6 w-px bg-slate-200 mx-1" />

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sign Out</div>
                    {activeTeacherTodayRecord?.timeOut ? (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-black inline-flex items-center gap-1">
                        <LogOut className="w-3 h-3 text-blue-600" />
                        {activeTeacherTodayRecord.timeOut}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Not Signed Out</span>
                    )}
                  </div>
                </div>
              </div>

              {/* REAL-TIME LIVE CAMERA SCANNER VIEWPORT */}
              <div className={`relative bg-slate-950 rounded-3xl overflow-hidden border-2 transition-all duration-300 aspect-video flex items-center justify-center shadow-2xl ${
                scanSuccessPulse ? 'border-emerald-400 ring-4 ring-emerald-500/30' : 'border-indigo-900/60'
              }`}>
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* HUD Status Bar Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90 z-20 pointer-events-none">
                      <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold">REAL-TIME OPTICAL CAMERA STREAM</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-950/80 backdrop-blur-md px-2 py-1 rounded-full border border-indigo-400/30 text-indigo-300 font-bold hidden sm:inline-block">
                          AUTO-DETECT ACTIVE
                        </span>
                      </div>
                    </div>

                    {/* Laser Scanner Line & Corner Bracket HUD */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-56 h-56 border border-emerald-500/20 rounded-2xl relative shadow-2xl flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                        <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan-laser" />

                        <div className="text-[10px] font-black text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/40 backdrop-blur-md shadow-lg uppercase tracking-wider">
                          Point Camera at QR Code
                        </div>
                      </div>
                    </div>

                    {/* On-Screen Camera Controls Bar */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        title="Switch Camera Facing"
                      >
                        <SwitchCamera className="w-3.5 h-3.5 text-indigo-300" />
                        <span className="capitalize">{facingMode} Cam</span>
                      </button>

                      {isTorchSupported && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                            isTorchOn ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-900/80 text-white border-white/20'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isTorchOn ? 'Flash On' : 'Flash Off'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-300 shadow-inner">
                      <Camera className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">Live Camera Feed</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {cameraError || 'Camera permissions restricted. Tap below to activate live camera scanning.'}
                      </p>
                    </div>

                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-2 mx-auto"
                    >
                      <Camera className="w-4 h-4" /> SCAN  (to Sign-In/Out to register)
                    </button>
                  </div>
                )}
              </div>

              {/* AUTOMATIC SCANNER GUIDANCE & ATTENDANCE STATUS HUD */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 p-4 rounded-2xl space-y-3 shadow-lg text-white">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wide flex items-center gap-2">
                        <span>Hands-Free Auto-Attendance System</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                          {cooldownRemaining > 0 ? `Ready in ${cooldownRemaining}s` : 'Active & Ready'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Position your QR code in front of the camera. Attendance is registered automatically.
                      </p>
                    </div>
                  </div>

                  {/* Working Hours Badge */}
                  <div className="hidden sm:block text-right bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl shrink-0">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Working Period</div>
                    <div className="text-xs font-black font-mono text-amber-300">
                      {workingHours.startTime} – {workingHours.closingTime}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Late after: {workingHours.latenessCutoff} (+{workingHours.gracePeriodMinutes || 0}m)
                    </div>
                  </div>
                </div>

                {/* State Machine Visualizer */}
                <div className="bg-black/30 border border-white/10 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    {!activeTeacherTodayRecord?.timeIn ? (
                      <span className="flex items-center gap-1.5 font-bold text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                        Next scan will automatically record: <strong className="text-white uppercase bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/30">Arrival (Sign In)</strong>
                      </span>
                    ) : !activeTeacherTodayRecord?.timeOut ? (
                      <span className="flex items-center gap-1.5 font-bold text-sky-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                        Signed in at {activeTeacherTodayRecord.timeIn}. Next scan will record: <strong className="text-white uppercase bg-blue-500/30 px-2 py-0.5 rounded border border-blue-400/30">Sign Out (Close of School)</strong>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Today's Attendance Completed: In at {activeTeacherTodayRecord.timeIn} • Out at {activeTeacherTodayRecord.timeOut}
                      </span>
                    )}
                  </div>

                  {cooldownRemaining > 0 && (
                    <div className="text-[10px] font-mono bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 px-2.5 py-1 rounded-lg animate-pulse">
                      Cooldown active ({cooldownRemaining}s)
                    </div>
                  )}
                </div>
              </div>

              {/* SUCCESS SCAN RESULT BANNER */}
              {scanResult && (
                <div className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between animate-fade-in ${
                  scanResult.actionType === 'sign_out' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      {scanResult.actionType === 'sign_out' ? <LogOut className="w-6 h-6 text-white" /> : <LogIn className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <div className="font-black text-sm text-white">
                        {scanResult.record.teacherName} — {scanResult.actionType === 'sign_out' ? 'Signed Out Successfully!' : 'Signed In Successfully!'}
                      </div>
                      <div className="text-xs text-white/90 font-medium mt-0.5">
                        {scanResult.actionType === 'sign_out' ? (
                          <>Time Out: <strong className="font-mono bg-white/20 px-2 py-0.5 rounded text-white">{scanResult.record.timeOut}</strong> (Time In: {scanResult.record.timeIn})</>
                        ) : (
                          <>Status: <strong className="uppercase bg-white/20 px-2 py-0.5 rounded text-white font-mono mr-1">{scanResult.record.status}</strong> Time In: {scanResult.record.timeIn}</>
                        )}
                      </div>
                      <div className="text-[10px] text-white/70 mt-1">Verified via {scanResult.record.clockInMethod || 'Live Camera QR'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OFFICE TERMINAL DISPLAY (ADMIN / OFFICE KIOSK MODE) */}
          {activeTab === 'office_terminal' && !hideOfficeTerminal && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Official JIPAS Reception Terminal Code
                </span>
                <h4 className="text-base font-black text-slate-900">Scan Code Below Upon Arrival & Departure</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Teachers scan this code using their camera to record Sign In on arrival and Sign Out on departure.
                </p>
              </div>

              {/* Big Office QR Code Display Card */}
              <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 rounded-3xl text-center space-y-4 shadow-xl border border-indigo-900/80">
                <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-indigo-400/30">
                  {officeQrDataUrl ? (
                    <img src={officeQrDataUrl} alt="JIPAS Office Daily QR Code" className="w-56 h-56 mx-auto" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-mono text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Station: MAIN-OFFICE-01
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Valid: Today ({todayDateStr})
                  </span>
                </div>
              </div>

              {/* Quick Select Sign In & Sign Out for Any Teacher */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Office Desk Staff Terminal Controls:</span>
                  <span className="text-[10px] text-slate-500">Select teacher for desk sign in/out</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedTeacherForTerminal}
                    onChange={(e) => setSelectedTeacherForTerminal(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {teachersList.map(t => {
                      const rec = todayRecords.find(r => r.teacherId === t.id);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation || 'Teacher'}) {rec?.timeIn ? `— In: ${rec.timeIn}` : ''} {rec?.timeOut ? `| Out: ${rec.timeOut}` : ''}
                        </option>
                      );
                    })}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const t = teachersList.find(x => x.id === selectedTeacherForTerminal);
                        if (t) handleScanAttendance(t, 'Office Station Terminal', 'sign_in');
                      }}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </button>

                    <button
                      onClick={() => {
                        const t = teachersList.find(x => x.id === selectedTeacherForTerminal);
                        if (t) handleScanAttendance(t, 'Office Station Terminal', 'sign_out');
                      }}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Live Attendance Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Today's Attendance Sign In/Out Log ({todayRecords.length} staff)</span>
                  <span className="text-slate-500 text-[10px] font-normal">{todayDateStr}</span>
                </div>

                {todayRecords.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No teacher attendance records logged yet today.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white text-xs">
                    {todayRecords.map((r, i) => (
                      <div key={r.id || i} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                            {r.teacherName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{r.teacherName}</div>
                            <div className="text-[10px] text-slate-400">{r.clockInMethod || 'Camera Scanner'}</div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-slate-400">Sign In</div>
                            <div className="text-xs font-mono font-bold text-emerald-700">{r.timeIn || '—'}</div>
                          </div>

                          <div className="h-5 w-px bg-slate-200" />

                          <div>
                            <div className="text-[10px] text-slate-400">Sign Out</div>
                            <div className="text-xs font-mono font-bold text-blue-700">{r.timeOut || 'Pending'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY STAFF QR BADGE */}
          {activeTab === 'my_qr_badge' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-slate-900">Personal Staff QR Attendance Badge</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Present this QR code to the office attendance terminal camera when signing in or signing out.
                </p>
              </div>

              {/* Staff ID Printable Card Frame */}
              <div id="staff-qr-badge-print-area" className="max-w-md mx-auto bg-gradient-to-br from-indigo-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 shadow-2xl border border-indigo-500/30 text-center space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="text-left">
                    <div className="text-xs font-black uppercase text-indigo-300 tracking-wider">JIPAS ACADEMY</div>
                    <div className="text-[9px] text-indigo-200">Staff Identity & Attendance Badge</div>
                  </div>
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="bg-white p-3.5 rounded-2xl inline-block shadow-xl">
                  {myBadgeQrDataUrl ? (
                    <img src={myBadgeQrDataUrl} alt="Staff Attendance Badge QR" className="w-48 h-48 mx-auto" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      Loading Badge QR...
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-lg font-black text-white">{activeTeacher?.name}</div>
                  <div className="text-xs text-indigo-200 font-medium">{activeTeacher?.designation || 'Class Teacher'}</div>
                  <div className="text-[10px] font-mono text-indigo-300 mt-1">STAFF ID: {activeTeacher?.staffId || activeTeacher?.id}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <a
                  href={myBadgeQrDataUrl}
                  download={`JIPAS_Staff_QR_${activeTeacher?.name?.replace(/\s+/g, '_')}.png`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" /> Download QR Badge Image
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Badge
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            JIPAS Live Optical Camera Scanner
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
