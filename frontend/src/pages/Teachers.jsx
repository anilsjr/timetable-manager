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
import * as teacherApi from '../services/teacherApi';
import * as subjectApi from '../services/subjectApi';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  short_abbr: z.string().min(1, 'Short abbreviation required'),
  code: z.string().optional(),
  subjects: z.array(z.string()).optional().default([]),
  max_load_per_day: z.coerce.number().int().min(1).optional().nullable(),
});

const columns = [
  { key: 'name', label: 'Faculty Name' },
  { key: 'short_abbr', label: 'Abbr' },
  { key: 'code', label: 'Code' },
  {
    key: 'subjects',
    label: 'Subjects',
    render: (_, row) => {
      const subs = row.subjects || [];
      if (!subs.length) return '—';
      return (
        <div className="flex flex-wrap gap-1.5">
          {subs.map((s, i) => {
            const label = typeof s === 'object' ? `${s.short_name} (${s.code})` : s;
            return (
              <span
                key={s._id || i}
                className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {label}
              </span>
            );
          })}
        </div>
      );
    },
  },
];

export default function Teachers() {
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
  const [subjects, setSubjects] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherApi.getTeachers({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    subjectApi.getSubjects({ page: 1, limit: 100 }).then((r) => setSubjects(r.data)).catch(() => {});
  }, []);

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
    defaultValues: { name: '', short_abbr: '', code: '', subjects: [], max_load_per_day: null },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', short_abbr: '', code: '', subjects: [], max_load_per_day: null });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      name: row.name,
      short_abbr: row.short_abbr,
      code: row.code || '',
      subjects: (row.subjects || []).map((s) => (typeof s === 'object' ? s._id : s)),
      max_load_per_day: row.max_load_per_day ?? null,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, subjects: values.subjects || [] };
      if (editing) {
        await teacherApi.updateTeacher(editing._id, payload);
        toast.success('Teacher updated');
      } else {
        await teacherApi.createTeacher(payload);
        toast.success('Teacher created');
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
      await teacherApi.deleteTeacher(deleteTarget._id);
      toast.success('Teacher deleted');
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
        <h2 className="text-xl font-bold text-gray-800">Teachers</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search.." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Teacher"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No teachers" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Abbreviation</label>
            <input {...register('short_abbr')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            {errors.short_abbr && <p className="text-red-500 text-sm mt-1">{errors.short_abbr.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code (optional)</label>
            <input {...register('code')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
            <p className="text-xs text-gray-500 mb-2">Select the subjects this teacher teaches</p>
            <div className="border rounded p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-500">No subjects available. Add subjects first.</p>
              ) : (
                subjects.map((s) => {
                  const selected = (watch('subjects') || []).includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1.5 -mx-2"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const current = watch('subjects') || [];
                          if (e.target.checked) {
                            setValue('subjects', [...current, s._id]);
                          } else {
                            setValue('subjects', current.filter((id) => id !== s._id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {s.short_name} ({s.code})
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Load Per Day (optional)</label>
            <input
              {...register('max_load_per_day')}
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty for no limit"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
