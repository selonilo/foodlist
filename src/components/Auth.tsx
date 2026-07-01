import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Mail, Lock, User, Key, Users, PlusCircle, LogIn, Sparkles } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile,
  signInAnonymously
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { getUserProfile, createUserProfile, getGroupMembers } from "../lib/firebase-service";

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  // Authentication Method: 'passwordless' is default for immediate seamless use
  const [authMethod, setAuthMethod] = useState<'passwordless' | 'email'>('passwordless');
  
  // Passwordless (Fast Entry) States
  const [plName, setPlName] = useState('');
  const [plAction, setPlAction] = useState<'create' | 'join'>('create');
  const [plGroupCode, setPlGroupCode] = useState('');

  // Email/Password States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to generate a random 6-character family code
  const generateGroupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Passwordless Login / Register
  const handlePasswordlessAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName.trim()) {
      setError('Lütfen isminizi girin.');
      return;
    }

    if (plAction === 'join' && !plGroupCode.trim()) {
      setError('Lütfen 6 haneli aile kodunu girin.');
      return;
    }

    if (plAction === 'join' && plGroupCode.trim().length !== 6) {
      setError('Aile kodu 6 karakterden oluşmalıdır.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalGroupId = plAction === 'create' 
        ? generateGroupCode() 
        : plGroupCode.toUpperCase().trim();

      // If they are joining an existing group, check if it exists AND check for existing name
      if (plAction === 'join') {
        const existingMembers = await getGroupMembers(finalGroupId);
        if (existingMembers.length === 0) {
          setError('Bu kodla eşleşen aktif bir aile grubu bulunamadı. Lütfen kodu kontrol edin.');
          setLoading(false);
          return;
        }

        // Try to find if a member with the same display name already exists in this group
        const normalizedNameInput = plName.trim().toLocaleLowerCase('tr');
        const matchingMember = existingMembers.find(m => 
          (m.displayName || '').trim().toLocaleLowerCase('tr') === normalizedNameInput
        );

        if (matchingMember) {
          // If Ahmet is already in ABCDEF, log him in directly as the same user profile!
          localStorage.setItem('yemek_user', JSON.stringify(matchingMember));
          onAuthSuccess();
          setLoading(false);
          return;
        }
      }

      // If they are creating a new group or joining with a unique name:
      let uid: string;
      let guestEmail: string;

      try {
        // Try real Firebase Anonymous Auth first
        const userCredential = await signInAnonymously(auth);
        const firebaseUser = userCredential.user;
        uid = firebaseUser.uid;
        guestEmail = `quick_${uid}@family.local`;
        
        // Enforce displayName update in Firebase auth object
        await updateProfile(firebaseUser, {
          displayName: plName.trim()
        });
      } catch (authErr: any) {
        console.warn('Firebase Anonymous Auth is disabled or restricted. Falling back to local guest UID.', authErr);
        // Fallback: Generate a secure local UID
        uid = 'quick_user_' + Math.random().toString(36).substring(2, 11);
        guestEmail = `quick_${uid}@family.local`;
      }

      const profile = await createUserProfile(uid, {
        email: guestEmail,
        displayName: plName.trim(),
        groupId: finalGroupId,
        ownedGroups: plAction === 'create' ? [finalGroupId] : []
      });

      if (profile) {
        localStorage.setItem('yemek_user', JSON.stringify(profile));
        onAuthSuccess();
      } else {
        throw new Error('Giriş profili oluşturulamadı.');
      }
    } catch (err: any) {
      console.error('Passwordless Auth Error:', err);
      setError(err.message || 'Hızlı giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("Google account does not have an email address associated with it.");
      }

      // Check if user profile already exists in Firestore
      let profile = await getUserProfile(firebaseUser.uid);
      
      if (!profile) {
        // First-time Google user, create profile
        const newGroupCode = generateGroupCode();
        const fallbackName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        profile = await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: fallbackName,
          groupId: newGroupCode,
          ownedGroups: [newGroupCode]
        });
      }

      if (profile) {
        localStorage.setItem('yemek_user', JSON.stringify(profile));
        onAuthSuccess();
      } else {
        throw new Error("Kullanıcı profili oluşturulamadı.");
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let errMsg = "Google ile giriş yaparken hata oluştu.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "Giriş penceresi tarayıcınız tarafından engellendi. Lütfen açılır pencerelere izin verin.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (isSignUp && !displayName) {
      setError('Lütfen isminizi girin.');
      return;
    }
    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Register in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name in Auth profile
        await updateProfile(firebaseUser, { displayName });

        // Create profile document in Firestore
        const newGroupCode = generateGroupCode();
        const profile = await createUserProfile(firebaseUser.uid, {
          email,
          displayName,
          groupId: newGroupCode,
          ownedGroups: [newGroupCode]
        });

        if (profile) {
          localStorage.setItem('yemek_user', JSON.stringify(profile));
          onAuthSuccess();
        } else {
          throw new Error("Hesap oluşturuldu fakat veritabanı profili kaydedilemedi.");
        }
      } else {
        // Login in Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Fetch profile document from Firestore
        let profile = await getUserProfile(firebaseUser.uid);

        if (!profile) {
          // If profile doc is missing for some reason, create it now
          const newGroupCode = generateGroupCode();
          profile = await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || displayName || email.split('@')[0],
            groupId: newGroupCode,
            ownedGroups: [newGroupCode]
          });
        }

        if (profile) {
          localStorage.setItem('yemek_user', JSON.stringify(profile));
          onAuthSuccess();
        } else {
          throw new Error("Kullanıcı profili yüklenemedi.");
        }
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      let errMsg = "Kimlik doğrulama sırasında bir hata oluştu.";
      if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        errMsg = "E-posta/Şifre ile giriş yöntemi Firebase projenizde henüz etkinleştirilmemiş. Firebase Console -> Authentication -> Sign-in method sekmesinden 'Email/Password' sağlayıcısını etkinleştirmeniz gerekir. Veya yukarıdaki 'Google ile Giriş Yap' seçeneğini kullanabilirsiniz.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "Bu e-posta adresi zaten kullanımda.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "E-posta adresi veya şifre hatalı.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Geçersiz e-posta adresi formatı.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center p-4 sm:p-6" id="auth-container">
      <div className="w-full max-w-md bg-white dark:bg-[#12141d] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6" id="auth-card">
        
        {/* Header */}
        <div className="text-center space-y-2" id="auth-header">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mx-auto" id="auth-logo">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Aile Paylaşım Notu</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Yemek takvimini, tarifleri ve market listesini ortaklaşa yönetin
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800" id="auth-tabs">
          <button
            onClick={() => {
              setAuthMethod('passwordless');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMethod === 'passwordless'
                ? 'bg-white dark:bg-[#12141d] text-slate-800 dark:text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🚀 Şifresiz Hızlı Giriş
          </button>
          <button
            onClick={() => {
              setAuthMethod('email');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMethod === 'email'
                ? 'bg-white dark:bg-[#12141d] text-slate-800 dark:text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔒 E-posta Girişi (Gelişmiş)
          </button>
        </div>

        {/* Error Message Display */}
        {error && (
          error.includes("etkinleştirilmemiş") ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 space-y-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed animate-fade-in" id="auth-error-special">
              <div className="flex items-start gap-2.5 font-bold">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <span>Önemli: Firebase E-posta Girişi Devre Dışı</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                E-posta/şifre ile giriş sağlayıcısı Firebase Console üzerinde henüz aktifleştirilmemiş. Bunu düzeltmek çok kolaydır:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-amber-800 dark:text-amber-300">
                <li><a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100">Firebase Konsolu'na</a> gidin.</li>
                <li>Sol menüden <strong className="font-semibold">Authentication</strong> (Kimlik Doğrulama) bölümüne tıklayın.</li>
                <li>Üstteki <strong className="font-semibold">Sign-in method</strong> (Giriş yöntemi) sekmesine geçin.</li>
                <li><strong className="font-semibold">Add new provider</strong> (Yeni sağlayıcı ekle) butonuna tıklayıp <strong className="font-semibold">Email/Password</strong> (E-posta/Şifre) seçeneğini aktifleştirin ve kaydedin.</li>
              </ol>
              <div className="pt-1.5 border-t border-amber-200/50 dark:border-amber-900/30 text-[10.5px] font-medium text-amber-700 dark:text-amber-400">
                💡 <span className="underline">Geçici çözüm:</span> Sağlayıcıyı açana kadar yukarıdaki <strong className="font-semibold">Google ile Giriş Yap</strong> seçeneğini deneyebilir veya <strong className="font-semibold">🚀 Şifresiz Hızlı Giriş</strong> sekmesini kullanarak şifresiz şekilde anında başlayabilirsiniz!
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 leading-relaxed animate-fade-in" id="auth-error">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )
        )}

        {/* 1. PASSWORDLESS AUTHENTICATION FLOW */}
        {authMethod === 'passwordless' && (
          <form onSubmit={handlePasswordlessAuth} className="space-y-4" id="auth-passwordless-form">
            
            {/* Display Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">İsminiz</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Örn. Salih, Elif..."
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs outline-none transition-all text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Grupta yaptığınız değişikliklerde isminiz görünecektir.
              </p>
            </div>

            {/* Action Selection (Create or Join) */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Aile Grubu Seçimi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlAction('create')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    plAction === 'create'
                      ? 'border-emerald-500/80 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <PlusCircle className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Yeni Aile Oluştur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlAction('join')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    plAction === 'join'
                      ? 'border-emerald-500/80 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <LogIn className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Mevcut Aileye Katıl</span>
                </button>
              </div>
            </div>

            {/* Group Code Input (Only if Joining) */}
            {plAction === 'join' && (
              <div className="space-y-1 animate-slide-up">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">6 Haneli Aile Kodu</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Örn. AX3F8K"
                    value={plGroupCode}
                    onChange={(e) => setPlGroupCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs font-mono outline-none tracking-widest uppercase transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Diğer aile üyelerinden aldığınız 6 haneli kodu girin.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all cursor-pointer shadow-md shadow-emerald-600/10"
              id="passwordless-submit-btn"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : plAction === 'create' ? (
                'Yeni Aile Oluştur ve Giriş Yap'
              ) : (
                'Aileye Katıl ve Giriş Yap'
              )}
            </button>
          </form>
        )}

        {/* 2. ADVANCED EMAIL/PASSWORD FLOW */}
        {authMethod === 'email' && (
          <div className="space-y-4">
            
            {/* Google Authentication Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-11 border border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-950/50 active:bg-slate-100 dark:active:bg-slate-900 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              id="google-signin-btn"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.67 1.48 7.56l3.77 2.92C6.18 7.02 8.85 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.3-4.81 3.3-8.37z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.48c-.25-.76-.39-1.57-.39-2.42s.14-1.66.39-2.42L1.48 6.72C.53 8.61 0 10.74 0 13s.53 4.39 1.48 6.28l3.77-2.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.6-2.79c-1 .67-2.28 1.07-4.36 1.07-3.15 0-5.82-1.98-6.77-4.94L1.46 16.34C3.38 20.24 7.35 23 12 23z"
                  />
                </svg>
              )}
              <span>Google ile Giriş Yap</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span>veya</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            {/* Email Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4" id="auth-email-form">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Adınız Soyadınız</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ahmet Yılmaz"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs outline-none transition-all text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="ornek@posta.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs outline-none transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Şifre</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs outline-none transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                id="email-auth-submit-btn"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  'Kayıt Ol ve Giriş Yap'
                ) : (
                  'E-posta ile Giriş Yap'
                )}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-all cursor-pointer"
                id="toggle-auth-mode-btn"
              >
                {isSignUp ? (
                  <span>Zaten bir hesabınız var mı? <strong className="text-emerald-600 font-bold hover:underline">Giriş Yapın</strong></span>
                ) : (
                  <span>Hesabınız yok mu? <strong className="text-emerald-600 font-bold hover:underline">Ücretsiz Kayıt Olun</strong></span>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
