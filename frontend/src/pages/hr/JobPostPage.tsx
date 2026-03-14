import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsAPI, searchAPI } from '../../api/queries';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiArrowUp, HiArrowDown } from 'react-icons/hi';

interface Question {
  questionText: string;
  questionType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  options: string[];
  isRequired: boolean;
  order: number;
}

export default function JobPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Skills
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillResults, setSkillResults] = useState<any[]>([]);

  // Questionnaire
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const { data } = await jobsAPI.getById(id!);
      const fields = ['title', 'description', 'location', 'jobType', 'experienceMin', 'experienceMax', 'salaryMin', 'salaryMax', 'status'];
      fields.forEach((f) => { if (data[f] !== null) setValue(f, data[f]); });
      if (data.deadline) setValue('deadline', data.deadline.split('T')[0]);
      if (data.jobSkills) {
        setSelectedSkills(data.jobSkills.map((js: any) => ({
          skillId: js.skillId, name: js.skill.name, required: js.required, weight: js.weight,
        })));
      }
      if (data.questionnaire?.questions) {
        setQuestions(data.questionnaire.questions.map((q: any) => ({
          questionText: q.questionText, questionType: q.questionType, options: q.options, isRequired: q.isRequired, order: q.order,
        })));
      }
    } catch { navigate('/hr/jobs'); }
  };

  const searchSkills = async (q: string) => {
    setSkillSearch(q);
    if (q.length < 2) { setSkillResults([]); return; }
    try {
      const { data } = await searchAPI.suggestSkills(q);
      const existing = new Set(selectedSkills.map((s) => s.skillId));
      setSkillResults([...data.matches, ...data.related].filter((s: any) => !existing.has(s.id)));
    } catch {}
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', questionType: 'TEXT', options: [], isRequired: false, order: questions.length }]);
  };

  const removeQuestion = (index: number) => setQuestions(questions.filter((_, i) => i !== index));

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next.map((q, i) => ({ ...q, order: i })));
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        experienceMin: data.experienceMin ? Number(data.experienceMin) : undefined,
        experienceMax: data.experienceMax ? Number(data.experienceMax) : undefined,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        skills: selectedSkills.map((s) => ({ skillId: s.skillId, required: s.required, weight: s.weight })),
        questionnaire: questions.length > 0 ? { questions } : undefined,
      };

      if (id) {
        await jobsAPI.update(id, payload);
        toast.success('Job updated!');
      } else {
        await jobsAPI.create(payload);
        toast.success('Job created!');
      }
      navigate('/hr/jobs');
    } catch (error: any) {
      toast.error('Failed to save job');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Job' : 'Post New Job'}</h1>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {['Details', 'Skills', 'Questionnaire', 'Review'].map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)} className={`px-4 py-2 rounded-lg text-sm font-medium ${step === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <Input label="Job Title" {...register('title', { required: 'Required' })} error={errors.title?.message as string} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description', { required: 'Required' })} rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Location" {...register('location')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select {...register('jobType')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="ONSITE">Onsite</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Experience Min (years)" type="number" {...register('experienceMin')} />
              <Input label="Experience Max (years)" type="number" {...register('experienceMax')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salary Min" type="number" {...register('salaryMin')} />
              <Input label="Salary Max" type="number" {...register('salaryMax')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Deadline" type="date" {...register('deadline')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...register('status')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>Next: Skills</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="relative">
              <Input placeholder="Search skills to add..." value={skillSearch} onChange={(e) => searchSkills(e.target.value)} />
              {skillResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {skillResults.map((s: any) => (
                    <button key={s.id} type="button" onClick={() => { setSelectedSkills([...selectedSkills, { skillId: s.id, name: s.name, required: false, weight: 5 }]); setSkillSearch(''); setSkillResults([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {selectedSkills.map((s, i) => (
                <div key={s.skillId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium flex-1">{s.name}</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={s.required} onChange={(e) => { const next = [...selectedSkills]; next[i].required = e.target.checked; setSelectedSkills(next); }} />
                    Required
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Weight:</span>
                    <input type="range" min="1" max="10" value={s.weight} onChange={(e) => { const next = [...selectedSkills]; next[i].weight = Number(e.target.value); setSelectedSkills(next); }} className="w-20" />
                    <span className="text-xs font-mono w-4">{s.weight}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedSkills(selectedSkills.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><HiTrash className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Next: Questionnaire</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Questionnaire (optional)</h2>
              <Button type="button" size="sm" variant="secondary" onClick={addQuestion}><HiPlus className="h-4 w-4 mr-1" />Add Question</Button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input value={q.questionText} onChange={(e) => { const next = [...questions]; next[i].questionText = e.target.value; setQuestions(next); }} placeholder="Question text" className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" />
                  <select value={q.questionType} onChange={(e) => { const next = [...questions]; next[i].questionType = e.target.value as any; setQuestions(next); }} className="rounded border border-gray-300 px-2 py-1 text-sm">
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="DATE">Date</option>
                    <option value="BOOLEAN">Yes/No</option>
                    <option value="SELECT">Select</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={q.isRequired} onChange={(e) => { const next = [...questions]; next[i].isRequired = e.target.checked; setQuestions(next); }} />
                    Req
                  </label>
                  <button type="button" onClick={() => moveQuestion(i, -1)}><HiArrowUp className="h-4 w-4 text-gray-400" /></button>
                  <button type="button" onClick={() => moveQuestion(i, 1)}><HiArrowDown className="h-4 w-4 text-gray-400" /></button>
                  <button type="button" onClick={() => removeQuestion(i)}><HiTrash className="h-4 w-4 text-red-400" /></button>
                </div>
                {q.questionType === 'SELECT' && (
                  <input value={q.options.join(',')} onChange={(e) => { const next = [...questions]; next[i].options = e.target.value.split(',').map((o) => o.trim()); setQuestions(next); }} placeholder="Comma-separated options" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                )}
              </div>
            ))}
            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button type="button" onClick={() => setStep(4)}>Review</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-lg">Review & Publish</h2>
            <p className="text-sm text-gray-500">Review your job posting before publishing.</p>
            <div className="text-sm space-y-1">
              <p><strong>Skills:</strong> {selectedSkills.map((s) => s.name).join(', ') || 'None'}</p>
              <p><strong>Questions:</strong> {questions.length}</p>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(3)}>Back</Button>
              <Button type="submit" isLoading={saving}>{id ? 'Update Job' : 'Publish Job'}</Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
