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
import * as roomApi from '../services/roomApi';

const schema = z.object({
  code: z.string().min(1, 'Code required'),
  type: z.enum(['class', 'lab'], { required_error: 'Type required' }),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
});

const columns = [
  { key: 'code', label: 'Code' },
  {
    key: 'type',
    label: 'Type',
    render: (val) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        val === 'class' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {val === 'class' ? 'Class' : 'Lab'}
      </span>
    ),
  },
  { key: 'capacity', label: 'Capacity', hideOnMobile: true },
];

export default function Rooms() {
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
      const res = await roomApi.getRooms({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch rooms');
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
    defaultValues: { code: '', type: 'class', capacity: 30 },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ code: '', type: 'class', capacity: 30 });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      code: row.code,
      type: row.type,
      capacity: row.capacity ?? 30,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await roomApi.updateRoom(editing._id, values);
        toast.success('Room updated');
      } else {
        await roomApi.createRoom(values);
        toast.success('Room created');
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
      await roomApi.deleteRoom(deleteTarget._id);
      toast.success('Room deleted');
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
        <h2 className="text-xl font-bold text-gray-800">Rooms</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search rooms..." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Room"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No rooms" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ModalForm 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editing ? 'Edit Room' : 'Add Room'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
              <input 
                {...register('code')} 
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g. LAB-CS1" 
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                {...register('type')} 
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="class">Class</option>
                <option value="lab">Lab</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input 
              {...register('capacity')} 
              type="number" 
              min="1"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" 
              placeholder="e.g. 30" 
            />
            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        message={deleteTarget ? `Are you sure you want to delete room "${deleteTarget.code}"?` : ''}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}