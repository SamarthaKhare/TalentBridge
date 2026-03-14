import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { applicationsAPI, jobsAPI } from '../../api/queries';
import ScoreRing from '../../components/ui/ScoreRing';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const STAGES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED'] as const;
const STAGE_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-50 border-blue-200',
  SHORTLISTED: 'bg-amber-50 border-amber-200',
  INTERVIEW: 'bg-purple-50 border-purple-200',
  OFFER: 'bg-green-50 border-green-200',
  REJECTED: 'bg-red-50 border-red-200',
};

export default function PipelinePage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        jobsAPI.getById(id!),
        applicationsAPI.forJob(id!),
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data);
    } catch {} finally { setLoading(false); }
  };

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as string;
    const app = applications.find((a) => a.id === draggableId);
    if (!app || app.status === newStatus) return;

    // Optimistic update
    setApplications(applications.map((a) => a.id === draggableId ? { ...a, status: newStatus } : a));

    try {
      await applicationsAPI.updateStatus(draggableId, newStatus);
      toast.success(`Moved to ${newStatus}`);
    } catch {
      toast.error('Failed to update');
      load();
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedApp) return;
    try {
      await applicationsAPI.addNote(selectedApp.id, noteText);
      toast.success('Note added');
      setNoteText('');
      load();
    } catch { toast.error('Failed'); }
  };

  const getAppsByStage = (stage: string) => applications.filter((a) => a.status === stage);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-full mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">{job?.title} - Pipeline</h1>
      <p className="text-sm text-gray-500 mb-6">{applications.length} total applicants</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Droppable key={stage} droppableId={stage}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-72 rounded-xl border p-3 min-h-[400px] ${STAGE_COLORS[stage]}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{stage}</h3>
                    <span className="text-xs bg-white rounded-full px-2 py-0.5">{getAppsByStage(stage).length}</span>
                  </div>
                  <div className="space-y-2">
                    {getAppsByStage(stage).map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-move"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{app.candidate?.name}</span>
                              <ScoreRing score={app.matchScore} size={32} />
                            </div>
                            <p className="text-xs text-gray-500">{app.candidate?.email}</p>
                            {app.candidate?.candidateProfile && (
                              <p className="text-xs text-gray-400 mt-1">{app.candidate.candidateProfile.headline}</p>
                            )}
                            <div className="flex gap-1 mt-2">
                              <button onClick={() => { setSelectedApp(app); setShowProfile(true); }} className="text-xs text-primary-600 hover:underline">Profile</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => { setSelectedApp(app); setShowProfile(false); }} className="text-xs text-primary-600 hover:underline">Notes ({app.notes?.length || 0})</button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Profile/Notes Modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title={showProfile ? 'Candidate Profile' : 'Notes'} size="lg">
        {selectedApp && showProfile && (
          <div className="space-y-3">
            <p><strong>Name:</strong> {selectedApp.candidate?.name}</p>
            <p><strong>Email:</strong> {selectedApp.candidate?.email}</p>
            {selectedApp.candidate?.candidateProfile && (
              <>
                <p><strong>Headline:</strong> {selectedApp.candidate.candidateProfile.headline}</p>
                <p><strong>Location:</strong> {selectedApp.candidate.candidateProfile.location}</p>
                <p><strong>Experience:</strong> {selectedApp.candidate.candidateProfile.experienceYears} years</p>
                <p><strong>Notice Period:</strong> {selectedApp.candidate.candidateProfile.noticePeriodDays} days</p>
                <div>
                  <strong>Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.candidate.candidateProfile.candidateSkills?.map((cs: any) => (
                      <span key={cs.id} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">{cs.skill.name} ({cs.proficiency})</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {selectedApp && !showProfile && (
          <div className="space-y-3">
            {selectedApp.notes?.map((n: any) => (
              <div key={n.id} className="p-2 bg-gray-50 rounded text-sm">
                <p>{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." rows={2} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <Button onClick={addNote} size="sm">Add</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
