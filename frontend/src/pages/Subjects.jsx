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
import * as subjectApi from '../services/subjectApi';

const schema = z.object({
  full_name: z.string().min(1, 'Full name required'),
  short_name: z.string().min(1, 'Short name required'),
  code: z.string().min(1, 'Code required'),
  weekly_frequency: z.coerce.number().int().min(1, 'Weekly frequency must be at least 1'),
  duration: z.coerce.number().int().min(1).optional().default(50),
});

const columns = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'short_name', label: 'Short Name' },
  { key: 'code', label: 'Code' },
  { key: 'weekly_frequency', label: 'Weekly Freq' },
  { key: 'duration', label: 'Duration (min)' },
];

export default function Subjects() {
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getSubjects({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      short_name: '',
      code: '',
      weekly_frequency: 1,
      duration: 50,
    },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ full_name: '', short_name: '', code: '', weekly_frequency: 1, duration: 50 });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      full_name: row.full_name,
      short_name: row.short_name,
      code: row.code,
      weekly_frequency: row.weekly_frequency,
      duration: row.duration ?? 50,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await subjectApi.updateSubject(editing._id, values);
        toast.success('Subject updated');
      } else {
        await subjectApi.createSubject(values);
        toast.success('Subject created');
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
      await subjectApi.deleteSubject(deleteTarget._id);
      toast.success('Subject deleted');
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
        <h2 className="text-xl font-bold text-gray-800">Subjects</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search.." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Subject"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No subjects" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              {...register('full_name')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
            <input
              {...register('short_name')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.short_name && <p className="text-red-500 text-sm mt-1">{errors.short_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              {...register('code')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={!!editing}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Frequency</label>
            <input
              {...register('weekly_frequency')}
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.weekly_frequency && <p className="text-red-500 text-sm mt-1">{errors.weekly_frequency.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              {...register('duration')}
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
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
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
