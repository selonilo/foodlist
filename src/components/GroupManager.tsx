import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, LogOut, ArrowRightLeft, UserPlus, Info, Trash2, X, ShieldAlert, ShieldCheck, UserCheck, UserX, Clock } from 'lucide-react';
import { 
  getGroupMembers,
  checkGroupExists,
  createJoinRequest,
  subscribeJoinRequests,
  subscribeSentJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  claimGroupAdmin
} from '../lib/firebase-service';
import { auth } from '../lib/firebase';

interface GroupManagerProps {
  currentGroupId: string;
  userEmail: string;
  userDisplayName: string;
  onSignOut: () => void;
  userProfile?: any;
  onSwitchGroup?: (groupId: string) => Promise<void>;
  onRemoveMember?: (uid: string) => Promise<void>;
  onJoinGroup?: (groupId: string) => Promise<void>;
  onCreateGroup?: () => Promise<void>;
  isMobileModal?: boolean;
}

interface MemberInfo {
  uid: string;
  displayName: string;
  email: string;
}

export default function GroupManager({ 
  currentGroupId, 
  userEmail, 
  userDisplayName, 
  onSignOut,
  userProfile,
  onSwitchGroup,
  onRemoveMember,
  onJoinGroup,
  onCreateGroup,
  isMobileModal = false
}: GroupManagerProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // In-app confirmation states to bypass blocked browser popups inside iframes
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [memberIdToConfirmRemove, setMemberIdToConfirmRemove] = useState<string | null>(null);

  // Real-time join requests lists
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  // Get current user from localStorage or auth
  const currentUserId = auth.currentUser?.uid || userProfile?.uid || '';

  // Safe fallback arrays for groups
  const joinedGroups = userProfile?.joinedGroups || [currentGroupId];
  const ownedGroups = userProfile?.ownedGroups || [];

  // Fetch members of the same family group
  const fetchGroupMembers = async () => {
    if (!currentGroupId) return;
    try {
      const data = await getGroupMembers(currentGroupId);
      setMembers(data as MemberInfo[]);
    } catch (error) {
      console.error("Error fetching group members:", error);
    }
  };

  useEffect(() => {
    fetchGroupMembers();
    // Poll every 10 seconds to keep family members lists updated
    const interval = setInterval(fetchGroupMembers, 10000);
    return () => clearInterval(interval);
  }, [currentGroupId]);

  // Subscribe to pending join requests for groups this user owns
  useEffect(() => {
    if (!ownedGroups || ownedGroups.length === 0) {
      setPendingRequests([]);
      return;
    }
    const unsubscribe = subscribeJoinRequests(ownedGroups, (requests) => {
      setPendingRequests(requests);
    });
    return () => unsubscribe();
  }, [JSON.stringify(ownedGroups)]);

  // Subscribe to sent pending requests from current user
  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = subscribeSentJoinRequests(currentUserId, (requests) => {
      setSentRequests(requests);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentGroupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinGroupClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetGroupId.trim().toUpperCase();
    if (!cleanId) return;

    if (cleanId === currentGroupId) {
      setMessage({ type: 'error', text: 'Zaten bu aile grubundasınız.' });
      return;
    }

    if (cleanId.length !== 6) {
      setMessage({ type: 'error', text: 'Geçersiz kod! Aile kodları tam 6 haneli olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Check if the group exists
      const exists = await checkGroupExists(cleanId);
      if (!exists) {
        setMessage({ type: 'error', text: 'Bu kodla eşleşen aktif bir aile grubu bulunamadı.' });
        return;
      }

      // 2. Check if a request was already sent
      const alreadySent = sentRequests.some(r => r.groupId === cleanId);
      if (alreadySent) {
        setMessage({ type: 'error', text: 'Bu gruba katılmak için zaten bekleyen bir isteğiniz var.' });
        return;
      }

      // 3. Create a join request instead of joining directly (approval mechanism)
      const success = await createJoinRequest(currentUserId, userDisplayName, userEmail, cleanId);
      if (success) {
        setMessage({ type: 'success', text: `${cleanId} grubu için katılım isteğiniz gönderildi. Grup yöneticisinin onayı bekleniyor.` });
        setTargetGroupId('');
      } else {
        setMessage({ type: 'error', text: 'Katılım isteği gönderilirken bir hata oluştu.' });
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Gruba katılım isteği gönderilirken hata oluştu: ' + (error.message || error) });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request: any) => {
    setLoading(true);
    try {
      const success = await approveJoinRequest(request.id, request.userId, request.groupId);
      if (success) {
        setMessage({ type: 'success', text: `${request.displayName} kullanıcısının katılım isteği onaylandı.` });
      } else {
        setMessage({ type: 'error', text: 'İstek onaylanırken hata oluştu.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const success = await rejectJoinRequest(requestId);
      if (success) {
        setMessage({ type: 'success', text: 'Katılım isteği reddedildi.' });
      } else {
        setMessage({ type: 'error', text: 'İstek reddedilirken hata oluştu.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdmin = async () => {
    setLoading(true);
    try {
      const success = await claimGroupAdmin(currentUserId, currentGroupId);
      if (success) {
        setMessage({ type: 'success', text: 'Tebrikler! Bu grubun yöneticisi oldunuz.' });
      } else {
        setMessage({ type: 'error', text: 'Yöneticilik yetkisi alınamadı.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewGroupClick = async () => {
    setLoading(true);
    setMessage(null);
    setShowCreateConfirm(false);

    try {
      if (onCreateGroup) {
        await onCreateGroup();
        setMessage({ type: 'success', text: 'Yeni aile grubunuz başarıyla oluşturuldu!' });
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Yeni grup oluşturulurken hata oluştu: ' + (error.message || error) });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Firebase Signout Error:", err);
    }
    localStorage.removeItem('yemek_user');
    onSignOut();
  };

  const isOwnerOfCurrentGroup = ownedGroups.includes(currentGroupId);

  return (
    <div className={isMobileModal ? "space-y-4 w-full" : "bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl border border-slate-200/40 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-5"} id="group-manager-panel">
      {/* Panel Title */}
      {!isMobileModal && (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display tracking-tight">Ortak Aile Grubu</h3>
          </div>
        </div>
      )}

      {/* User Information Summary with Sign Out Button */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs" id="user-info-summary">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold font-display text-xs shrink-0">
            {userDisplayName ? userDisplayName.slice(0, 2).toUpperCase() : 'YP'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{userDisplayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogoutClick}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-100 dark:border-rose-950 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Çıkış Yap"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Çıkış</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950 text-emerald-800 dark:text-emerald-400' 
            : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-950 text-red-800 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Active Group Switching */}
      {joinedGroups.length > 1 && onSwitchGroup && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gruplarım Arasında Geçiş Yap</label>
          <div className="grid grid-cols-2 gap-2" id="family-groups-selector">
            {joinedGroups.map((gId) => {
              const isCurrent = gId === currentGroupId;
              const isOwned = ownedGroups.includes(gId);
              return (
                <button
                  key={gId}
                  onClick={() => onSwitchGroup(gId)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="tracking-widest font-mono text-center flex-1">{gId}</span>
                  {isOwned && (
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase scale-90 ${isCurrent ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      Kurucu
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Share / Copy Group Code */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mevcut Aile Kodu</label>
          <span className="text-[10px] text-slate-400">Diğer üyelerle paylaşın</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-950/40 font-mono text-base font-bold text-emerald-800 dark:text-emerald-400 tracking-widest text-center py-2 px-3 rounded-xl shadow-3xs">
            {currentGroupId}
          </div>
          <button
            onClick={handleCopyCode}
            className="h-10 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:text-emerald-700 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            title="Kodu Kopyala"
          >
            {copied ? <Check className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Group Members List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grup Üyeleri</label>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-bold">{members.length} Üye</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 shadow-2xs">
          {members.map((member) => {
            const isSelf = member.uid === currentUserId;
            const isConfirming = memberIdToConfirmRemove === member.uid;

            return (
              <div key={member.uid} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {member.displayName} {isSelf && <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded-sm ml-1">Siz</span>}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{member.email}</p>
                </div>

                {/* Remove Member option if current user is owner of active group and target is not self */}
                {isOwnerOfCurrentGroup && !isSelf && onRemoveMember && (
                  <div className="shrink-0 flex items-center gap-1">
                    {isConfirming ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          onClick={async () => {
                            await onRemoveMember(member.uid);
                            setMemberIdToConfirmRemove(null);
                            fetchGroupMembers();
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold rounded-md transition-all cursor-pointer"
                          title="Üyeyi gruptan çıkarmak istediğinize emin misiniz?"
                        >
                          Çıkar
                        </button>
                        <button
                          onClick={() => setMemberIdToConfirmRemove(null)}
                          className="p-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-md transition-all cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setMemberIdToConfirmRemove(member.uid)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                        title="Gruptan Çıkar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Admin Role Option */}
      {!isOwnerOfCurrentGroup && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700 rounded-xl p-3 space-y-2 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Grup Yöneticisi Değilsiniz</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Bu grubun yöneticisi olmadığınız için gruptan üye çıkaramaz veya gruba katılım isteklerini onaylayamazsınız.
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimAdmin}
            disabled={loading}
            className="w-full h-8 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            👑 Kendimi Yönetici Yap
          </button>
        </div>
      )}

      {/* Pending Join Requests for Group Owners */}
      {isOwnerOfCurrentGroup && pendingRequests.length > 0 && (
        <div className="space-y-2 pt-1 animate-fade-in">
          <label className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Katılım İstekleri ({pendingRequests.length})
          </label>
          <div className="bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-900/40 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 shadow-2xs overflow-hidden">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-2.5 flex items-center justify-between gap-2 bg-amber-50/10 dark:bg-amber-950/5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{req.displayName}</p>
                  <p className="text-[9px] text-slate-400 truncate">{req.email}</p>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-mono">Grup Kodu: {req.groupId}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApproveRequest(req)}
                    disabled={loading}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900 transition-all cursor-pointer"
                    title="Onayla"
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    disabled={loading}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900 transition-all cursor-pointer"
                    title="Reddet"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Join Requests Status for Requesting Users */}
      {sentRequests.length > 0 && (
        <div className="space-y-2 pt-1 animate-fade-in">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Bekleyen İsteklerim</label>
          <div className="space-y-2">
            {sentRequests.map((req) => (
              <div key={req.id} className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-3 flex items-center justify-between gap-3 shadow-3xs">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    Onay Bekleniyor
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">{req.groupId}</span> grubuna katılma talebi gönderildi.
                  </p>
                </div>
                <button
                  onClick={() => handleRejectRequest(req.id)}
                  disabled={loading}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  İptal Et
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Another Group Form */}
      <form onSubmit={handleJoinGroupClick} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Başka Bir Gruba Katıl</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="KODU GİRİN"
            value={targetGroupId}
            onChange={(e) => setTargetGroupId(e.target.value.toUpperCase())}
            className="flex-1 h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-700 dark:text-slate-100 outline-hidden focus:border-emerald-500 dark:focus:border-emerald-500"
            maxLength={6}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !targetGroupId.trim()}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Katıl</span>
          </button>
        </div>
      </form>

      {/* Separate / Independent Group Option */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        {showCreateConfirm ? (
          <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950 rounded-xl p-3 space-y-2.5 animate-fade-in">
            <p className="text-[10px] font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              Mevcut ailenizden ayrılıp yeni bir bağımsız grup oluşturmak istediğinize emin misiniz?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNewGroupClick}
                disabled={loading}
                className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Evet, Yeni Grup Oluştur
              </button>
              <button
                onClick={() => setShowCreateConfirm(false)}
                className="py-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateConfirm(true)}
            disabled={loading}
            className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-dashed border-slate-200/80 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Bağımsız Yeni Grup Oluştur</span>
          </button>
        )}
      </div>

      {/* Explanatory Info Card */}
      <div className="bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl p-3 border border-emerald-100/60 dark:border-emerald-950/30 space-y-1 text-[10px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
        <h5 className="font-bold flex items-center gap-1 uppercase tracking-wider text-[9px] text-emerald-900 dark:text-emerald-300">
          <Info className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Aile Paylaşım Notu
        </h5>
        <p>
          Aynı aile kodunu kullanan tüm üyeler <strong>yemek takvimini, tarifleri ve market listesini</strong> ortak ve canlı olarak yönetir. Herkesin yaptığı değişiklikler anında diğer üyelerde güncellenir!
        </p>
      </div>
    </div>
  );
}
