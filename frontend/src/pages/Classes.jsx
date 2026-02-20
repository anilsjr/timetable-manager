import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import ModalForm from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import * as classApi from '../services/classApi';
import * as subjectApi from '../services/subjectApi';
import * as labApi from '../services/labApi';

const schema = z.object({
  class_name: z.string().min(1, 'Class name required'),
  year: z.coerce.number().int().min(1, 'Year required'),
  section: z.enum(['1', '2', '3', '4'], { required_error: 'Section required' }),
  student_count: z.coerce.number().int().min(0).optional().default(0),
  subjects: z.array(z.string()).optional().default([]),
  labs: z.array(z.string()).optional().default([]),
});

const columns = [
  { key: 'class_name', label: 'Class Name' },
  { key: 'year', label: 'Year', hideOnMobile: true },
  { key: 'section', label: 'Section', hideOnMobile: true },
  { key: 'code', label: 'Code' },
  {
    key: 'subjects',
    label: 'Subjects',
    hideOnMobile: true,
    render: (val, row) => {
      const list = row.subjects || [];
      if (!list.length) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {list.map((s) => {
            const label = s.code ? `${s.short_name || s.code} (${s.code})` : (s.short_name || s.code);
            return (
              <span
                key={s._id}
                className="inline-flex items-center  bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                title={s.full_name || label}
              >
                {label}
              </span>
            );
          })}
        </div>
      );
    },
  },
  {
    key: 'labs',
    label: 'Labs',
    hideOnMobile: true,
    render: (val, row) => {
      const list = row.labs || [];
      if (!list.length) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {list.map((l) => {
            const label = l.code ? `${l.short_name || l.name} (${l.code})` : (l.short_name || l.name);
            return (
              <span
                key={l._id}
                className="inline-flex items-center bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                title={l.name || label}
              >
                {label}
              </span>
            );
          })}
        </div>
      );
    },
  },
  { key: 'student_count', label: 'Students', hideOnMobile: true },
];

export default function Classes() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [subjectList, setSubjectList] = useState([]);
  const [labList, setLabList] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [labSearch, setLabSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classApi.getClasses({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [subRes, labRes] = await Promise.all([
          subjectApi.getSubjects({ limit: 500 }),
          labApi.getLabs({ limit: 500 }),
        ]);
        setSubjectList(subRes.data || []);
        setLabList(labRes.data || []);
      } catch {
        // non-blocking; modal will show empty lists
      }
    };
    if (modalOpen) loadOptions();
  }, [modalOpen]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { class_name: '', year: 1, section: '1', student_count: 0, subjects: [], labs: [] },
  });

  const selectedSubjectIds = watch('subjects') || [];
  const selectedLabIds = watch('labs') || [];

  const toggleSubject = (id) => {
    const next = selectedSubjectIds.includes(id)
      ? selectedSubjectIds.filter((s) => s !== id)
      : [...selectedSubjectIds, id];
    setValue('subjects', next, { shouldValidate: true });
  };

  const toggleLab = (id) => {
    const next = selectedLabIds.includes(id)
      ? selectedLabIds.filter((l) => l !== id)
      : [...selectedLabIds, id];
    setValue('labs', next, { shouldValidate: true });
  };

  const openCreate = () => {
    setEditing(null);
    reset({ class_name: '', year: 1, section: '1', student_count: 0, subjects: [], labs: [] });
    setSubjectSearch('');
    setLabSearch('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const subjectIds = (row.subjects || []).map((s) => (typeof s === 'object' ? s._id : s));
    const labIds = (row.labs || []).map((l) => (typeof l === 'object' ? l._id : l));
    reset({
      class_name: row.class_name,
      year: row.year,
      section: row.section,
      student_count: row.student_count ?? 0,
      subjects: subjectIds,
      labs: labIds,
    });
    setSubjectSearch('');
    setLabSearch('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        subjects: values.subjects || [],
        labs: values.labs || [],
      };
      if (editing) {
        await classApi.updateClass(editing._id, payload);
        toast.success('Class updated');
      } else {
        await classApi.createClass(payload);
        toast.success('Class created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await classApi.deleteClass(deleteTarget._id);
      toast.success('Class deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tableData = data.map((row) => ({
    ...row,
    _actions: (
      <div className="flex gap-2">
        <button
          onClick={() => openEdit(row)}
          className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600"
        >
          Edit
        </button>
        <button
          onClick={() => setDeleteTarget(row)}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Classes</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search.." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Class"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No classes" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
              <input {...register('class_name')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="e.g. CSEAIML" />
              {errors.class_name && <p className="text-red-500 text-sm mt-1">{errors.class_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select {...register('year')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
              {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select {...register('section')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              {errors.section && <p className="text-red-500 text-sm mt-1">{errors.section.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Count</label>
              <input {...register('student_count')} type="number" min={0} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
              {subjectList.length > 0 && (
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
              <div className="border rounded p-2 max-h-40 overflow-y-auto bg-gray-50">
                {subjectList.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No subjects. Add subjects first from Subjects page.</p>
                ) : (
                  (() => {
                    const filteredSubjects = subjectList.filter((s) => {
                      if (!subjectSearch.trim()) return true;
                      const searchLower = subjectSearch.toLowerCase();
                      return (
                        s.full_name?.toLowerCase().includes(searchLower) ||
                        s.short_name?.toLowerCase().includes(searchLower) ||
                        s.code?.toLowerCase().includes(searchLower)
                      );
                    });
                    if (filteredSubjects.length === 0) {
                      return <p className="text-sm text-gray-500 py-2">No subjects found matching "{subjectSearch}"</p>;
                    }
                    return (
                      <div className="space-y-1.5">
                        {filteredSubjects.map((s) => (
                          <label key={s._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(s._id)}
                              onChange={() => toggleSubject(s._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{s.short_name || s.code} {s.code && s.short_name !== s.code && `(${s.code})`}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Labs</label>
              {labList.length > 0 && (
                <input
                  type="text"
                  placeholder="Search labs..."
                  value={labSearch}
                  onChange={(e) => setLabSearch(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
              <div className="border rounded p-2 max-h-40 overflow-y-auto bg-gray-50">
                {labList.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No labs. Add labs first from Labs page.</p>
                ) : (
                  (() => {
                    const filteredLabs = labList.filter((l) => {
                      if (!labSearch.trim()) return true;
                      const searchLower = labSearch.toLowerCase();
                      return (
                        l.name?.toLowerCase().includes(searchLower) ||
                        l.short_name?.toLowerCase().includes(searchLower) ||
                        l.code?.toLowerCase().includes(searchLower)
                      );
                    });
                    if (filteredLabs.length === 0) {
                      return <p className="text-sm text-gray-500 py-2">No labs found matching "{labSearch}"</p>;
                    }
                    return (
                      <div className="space-y-1.5">
                        {filteredLabs.map((l) => (
                          <label key={l._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={selectedLabIds.includes(l._id)}
                              onChange={() => toggleLab(l._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{l.short_name || l.name} {l.code && `(${l.code})`}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.code || deleteTarget?.class_name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
