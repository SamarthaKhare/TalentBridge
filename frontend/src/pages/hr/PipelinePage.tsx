import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { applicationsAPI, jobsAPI } from '../../api/queries';
import ScoreRing from '../../components/ui/ScoreRing';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { HiOutlineDocumentText } from 'react-icons/hi';

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
  const [modalView, setModalView] = useState<'profile' | 'notes' | 'resume'>('profile');

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

  const getResumeUrl = (app: any): string | null => {
    return app?.candidate?.candidateProfile?.resumeUrl || null;
  };

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
                              <span className="text-sm font-medium truncate mr-2">{app.candidate?.name}</span>
                              <ScoreRing score={app.matchScore} size={32} />
                            </div>
                            <p className="text-xs text-gray-500 truncate">{app.candidate?.email}</p>
                            {app.candidate?.candidateProfile && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{app.candidate.candidateProfile.headline}</p>
                            )}
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              <button onClick={() => { setSelectedApp(app); setModalView('profile'); }} className="text-xs text-primary-600 hover:underline">Profile</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => { setSelectedApp(app); setModalView('notes'); }} className="text-xs text-primary-600 hover:underline">Notes ({app.notes?.length || 0})</button>
                              {getResumeUrl(app) && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button onClick={() => { setSelectedApp(app); setModalView('resume'); }} className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
                                    <HiOutlineDocumentText className="h-3 w-3" />Resume
                                  </button>
                                </>
                              )}
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

      {/* Profile Modal */}
      <Modal
        isOpen={!!selectedApp && modalView === 'profile'}
        onClose={() => setSelectedApp(null)}
        title="Candidate Profile"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-3">
            <p><strong>Name:</strong> {selectedApp.candidate?.name}</p>
            <p><strong>Email:</strong> {selectedApp.candidate?.email}</p>
            {selectedApp.candidate?.candidateProfile && (
              <>
                <p><strong>Headline:</strong> {selectedApp.candidate.candidateProfile.headline}</p>
                <p><strong>Location:</strong> {selectedApp.candidate.candidateProfile.location}</p>
                <p><strong>Experience:</strong> {selectedApp.candidate.candidateProfile.experienceYears} years</p>
                <p><strong>Notice Period:</strong> {selectedApp.candidate.candidateProfile.noticePeriodDays} days</p>
                <p><strong>Expected CTC:</strong> {selectedApp.candidate.candidateProfile.expectedCtc?.toLocaleString()}</p>
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
            {getResumeUrl(selectedApp) && (
              <div className="pt-3 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setModalView('resume')}
                >
                  <HiOutlineDocumentText className="h-4 w-4 mr-1" />
                  View Resume
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={!!selectedApp && modalView === 'notes'}
        onClose={() => setSelectedApp(null)}
        title={`Notes - ${selectedApp?.candidate?.name || ''}`}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-3">
            {selectedApp.notes?.length === 0 && (
              <p className="text-sm text-gray-400">No notes yet.</p>
            )}
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

      {/* Resume PDF Modal */}
      <Modal
        isOpen={!!selectedApp && modalView === 'resume'}
        onClose={() => setSelectedApp(null)}
        title={`Resume - ${selectedApp?.candidate?.name || ''}`}
        size="xl"
      >
        {selectedApp && getResumeUrl(selectedApp) && (
          <div className="flex flex-col h-[75vh]">
            <iframe
              src={getResumeUrl(selectedApp)!}
              className="w-full flex-1 rounded-lg border border-gray-200"
              title="Resume PDF"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModalView('profile')}
              >
                Back to Profile
              </Button>
              <a
                href={getResumeUrl(selectedApp)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
        {selectedApp && !getResumeUrl(selectedApp) && (
          <p className="text-sm text-gray-500 py-8 text-center">This candidate has not uploaded a resume.</p>
        )}
      </Modal>
    </div>
  );
}
