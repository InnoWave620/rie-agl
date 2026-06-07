'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Send, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

interface Application {
  id: string;
  candidateId: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    location: string;
  };
  atsScore?: number;
  decisionCategory?: string;
  status: string;
  createdAt: string;
}

interface Props {
  jobId: string;
  applications: Application[];
}

export default function TopCandidatesQueue({ jobId, applications }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter candidates who have an ATS score >= 80% (fast_track or auto_invite)
  // and whose status is pending, hr_review, scoring, or scored (not invited/rejected/hired)
  const queue = applications.filter(
    app =>
      app.atsScore != null &&
      app.atsScore >= 80 &&
      ['pending', 'hr_review', 'scoring', 'scored'].includes(app.status)
  );

  if (queue.length === 0) {
    return null;
  }

  const handleBulkInvite = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/bulk-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Successfully sent interview invites to all ${queue.length} top candidates!`);
        setTimeout(() => {
          setSuccessMessage(null);
          router.refresh();
        }, 3000);
      } else {
        alert(data.error || 'Failed to send bulk invitations.');
      }
    } catch (error) {
      console.error('Failed to send bulk invitations:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border border-green-500/20 bg-gradient-to-r from-green-50/50 to-emerald-50/30 p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Sparkles size={120} className="text-green-600" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Sparkles size={16} className="text-green-600 animate-pulse" />
            </div>
            <h3 className="font-bold text-base text-[#0A0F24]">Top Candidates Queue</h3>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {queue.length} ready to invite
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-xl">
            These candidates scored **80% or higher** in their ATS evaluation. You can review them in the pipeline below or invite all of them to interviews instantly with one click.
          </p>

          {/* List of candidates in the queue */}
          <div className="flex flex-wrap gap-2 pt-2">
            {queue.map(app => (
              <div
                key={app.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-gray-150 text-xs font-medium text-[#0A0F24] shadow-sm"
              >
                <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <span>
                  {app.candidate.firstName} {app.candidate.lastName}
                </span>
                <span className="text-green-600 font-bold">({app.atsScore?.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-stretch md:items-end gap-2.5">
          {successMessage ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-700 bg-green-50 border border-green-200">
              <CheckCircle size={16} className="text-green-600 animate-bounce" />
              {successMessage}
            </div>
          ) : (
            <button
              onClick={handleBulkInvite}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold shadow-md shadow-green-600/10 hover:shadow-lg hover:shadow-green-600/20 hover:opacity-95 active:scale-95 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending invites…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Bulk Invite to Interview ({queue.length})
                </>
              )}
            </button>
          )}
          <span className="text-[10px] text-gray-400 text-center md:text-right font-medium">
            This will update their statuses and email invitations automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
