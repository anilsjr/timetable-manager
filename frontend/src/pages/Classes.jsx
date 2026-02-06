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

const schema = z.object({
  class_name: z.string().min(1, 'Class name required'),
  year: z.coerce.number().int().min(1, 'Year required'),
  section: z.enum(['F', 'S', 'T', 'L'], { required_error: 'Section required' }),
  student_count: z.coerce.number().int().min(0).optional().default(0),
});

const columns = [
  { key: 'class_name', label: 'Class Name' },
  { key: 'year', label: 'Year' },
  { key: 'section', label: 'Section' },
  { key: 'code', label: 'Code' },
  { key: 'student_count', label: 'Students' },
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
    defaultValues: { class_name: '', year: 1, section: 'F', student_count: 0 },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ class_name: '', year: 1, section: 'F', student_count: 0 });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      class_name: row.class_name,
      year: row.year,
      section: row.section,
      student_count: row.student_count ?? 0,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await classApi.updateClass(editing._id, values);
        toast.success('Class updated');
      } else {
        await classApi.createClass(values);
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

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input {...register('class_name')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="e.g. CSEAIML" />
            {errors.class_name && <p className="text-red-500 text-sm mt-1">{errors.class_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input {...register('year')} type="number" min={1} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select {...register('section')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
              <option value="F">F</option>
              <option value="S">S</option>
              <option value="T">T</option>
              <option value="L">L</option>
            </select>
            {errors.section && <p className="text-red-500 text-sm mt-1">{errors.section.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Count</label>
            <input {...register('student_count')} type="number" min={0} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
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
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.code || deleteTarget?.class_name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
